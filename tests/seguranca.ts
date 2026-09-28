import {
    mkdtempSync, rmSync, readdirSync, readFileSync,
    writeFileSync, utimesSync
} from "fs";
import { join } from "path";
import { tmpdir } from "os";

import { CriptografiaArquivo } from "../src/persistencia/CriptografiaArquivo";
import { GerenciadorConfiguracaoMestre } from "../src/configuracao/GerenciadorConfiguracaoMestre";
import { JournalTransacao } from "../src/auditoria/JournalTransacao";
import { ServicoAutenticacao } from "../src/autenticacao/ServicoAutenticacao";
import { Credencial } from "../src/autenticacao/Credencial";
import { RepositorioArquivo } from "../src/persistencia/RepositorioArquivo";
import { ServicoOrganizacao } from "../src/servicos/ServicoOrganizacao";
import { ValidadorCNPJ } from "../src/validadores/ValidadorCNPJ";
import { PapelUsuario } from "../src/enums/PapelUsuario";

function assert(condicao: boolean, mensagem: string): void {
    if (!condicao) {
        throw new Error(mensagem);
    }
}

function main(): void {
    const dir = mkdtempSync(join(tmpdir(), "greencode-seguranca-"));
    console.log("Testes de segurança em", dir);

    try {
        const cripto = new CriptografiaArquivo();

        // 1. Provisionamento: cria config mestre, recarrega e não vaza a senha
        const arquivoMestre = join(dir, "configuracao-mestre.json.enc");
        const gerenciador = new GerenciadorConfiguracaoMestre(arquivoMestre, cripto);
        assert(!gerenciador.existe(), "Config mestre não deveria existir antes do provisionamento.");

        const criada = gerenciador.criar("admin", "SenhaForte#1");
        assert(gerenciador.existe(), "Config mestre deveria existir após provisionar.");

        const carregada = gerenciador.carregar();
        assert(carregada.chaveMestra === criada.chaveMestra, "Chave mestra deveria ser preservada.");
        assert(
            Buffer.from(carregada.chaveMestra, "base64").length === 32,
            "A chave mestra deveria ter 256 bits."
        );

        const bruto = readFileSync(arquivoMestre, "utf8");
        assert(!bruto.includes("SenhaForte#1"), "A senha não pode aparecer em texto plano.");
        assert(!bruto.includes(criada.chaveMestra), "A chave mestra não pode aparecer em texto plano.");

        // 2. AES-256-GCM: chave errada e adulteração são rejeitadas
        const cifrado = cripto.cifrar("segredo", criada.chaveMestra);
        let rejeitou = false;
        try { cripto.decifrar(cifrado, cripto.gerarChave()); } catch { rejeitou = true; }
        assert(rejeitou, "Chave incorreta deveria ser rejeitada.");

        const pacote = JSON.parse(cifrado);
        pacote.dados = Buffer.from("adulterado").toString("base64");
        rejeitou = false;
        try { cripto.decifrar(JSON.stringify(pacote), criada.chaveMestra); } catch { rejeitou = true; }
        assert(rejeitou, "Conteúdo adulterado deveria ser rejeitado (authTag).");

        // 3. Hash de senha com salt: mesmo password => hashes diferentes
        const c1 = new Credencial("a", "mesma", PapelUsuario.AUDITOR);
        const c2 = new Credencial("b", "mesma", PapelUsuario.AUDITOR);
        assert(c1.getHashSenha() !== c2.getHashSenha(), "Salt deveria diferenciar hashes.");
        assert(c1.getHashSenha().length === 64, "SHA-256 deveria gerar 64 caracteres hex.");
        assert(c1.verificarSenha("mesma") && !c1.verificarSenha("outra"), "Verificação de senha incorreta.");

        // 4. Retenção do journal: remove > 180 dias, preserva recentes
        const dirJournal = join(dir, "journal");
        JournalTransacao.configurar({
            caminho: join(dirJournal, "journal.log"),
            criptografia: cripto,
            chave: criada.chaveMestra,
            tamanhoMaximo: 10 * 1024 * 1024, // limite do requisito (config é estática)
            retencaoDias: 180
        });

        const registrar = (id: string, op: string) =>
            new JournalTransacao(id, new Date(), op, "Teste", null, { id }, "sistema").registrar();

        registrar("INIT", "INICIO"); // garante o diretório

        const antigo = join(dirJournal, "journal-rotated-antigo.log");
        const recente = join(dirJournal, "journal-rotated-recente.log");
        writeFileSync(antigo, "x");
        writeFileSync(recente, "x");
        const dias = (n: number) => new Date(Date.now() - n * 86400000);
        utimesSync(antigo, dias(200), dias(200));
        utimesSync(recente, dias(10), dias(10));

        registrar("RET", "RETENCAO");

        const restantes = readdirSync(dirJournal);
        assert(!restantes.includes("journal-rotated-antigo.log"), "Journal com 200 dias deveria ser removido.");
        assert(restantes.includes("journal-rotated-recente.log"), "Journal com 10 dias deveria ser mantido.");

        // 5. Troca de senha é auditada, sem vazar hash/senha
        const auth = new ServicoAutenticacao([
            new Credencial("op", "antiga", PapelUsuario.OPERADOR_CADASTRO)
        ]);
        assert(auth.alterarSenha("op", "antiga", "nova"), "Troca de senha deveria funcionar.");
        assert(!auth.alterarSenha("op", "antiga", "x"), "Senha antiga não deveria mais valer.");

        const journal = readFileSync(join(dirJournal, "journal.log"), "utf8");
        assert(!journal.includes("antiga") && !journal.includes("nova"), "Journal está cifrado e sem senhas.");
        const linhas = journal.trim().split("\n").filter(Boolean);
        const operacoes = linhas.map((l) => JSON.parse(cripto.decifrar(l, criada.chaveMestra)).operacao);
        assert(operacoes.includes("ALTERAR_SENHA"), "Troca de senha deveria constar no journal.");

        // 6. CNPJ duplicado é rejeitado (unicidade)
        const repo = new RepositorioArquivo(dir, cripto, criada.chaveMestra);
        const servicoOrg = new ServicoOrganizacao(
            repo,
            new ValidadorCNPJ(),
            new JournalTransacao("BOOT", new Date(), "INIT", "Sistema", null, null, "sistema")
        );
        const dadosOrg = {
            razaoSocial: "Empresa A",
            cnpj: "11.444.777/0001-61", // CNPJ com dígitos verificadores válidos
            inscricaoEstadual: "1",
            enderecoCompleto: "Rua A",
            telefone: "1",
            email: "a@a.com",
            contrato: {
                dataVencimento: new Date(Date.now() + 365 * 86400000),
                valorMensal: 10,
                renovacaoAutomatica: false
            }
        };
        servicoOrg.cadastrarOrganizacao(dadosOrg);
        let duplicado = false;
        try {
            servicoOrg.cadastrarOrganizacao({ ...dadosOrg, razaoSocial: "Empresa B" });
        } catch {
            duplicado = true;
        }
        assert(duplicado, "CNPJ duplicado deveria ser rejeitado.");

        console.log("Testes de segurança: PASS");
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
}

main();
