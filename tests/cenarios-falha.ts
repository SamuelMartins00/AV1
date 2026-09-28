import { mkdtempSync, rmSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

import { CriptografiaArquivo } from "../src/persistencia/CriptografiaArquivo";
import { RepositorioArquivo } from "../src/persistencia/RepositorioArquivo";
import { JournalTransacao } from "../src/auditoria/JournalTransacao";
import { ServicoOrganizacao } from "../src/servicos/ServicoOrganizacao";
import { ServicoLote } from "../src/servicos/ServicoLote";
import { ValidadorCNPJ } from "../src/validadores/ValidadorCNPJ";
import { ValidadorDataEntrada } from "../src/validadores/ValidadorDataEntrada";
import { ServicoAutenticacao } from "../src/autenticacao/ServicoAutenticacao";
import { Credencial } from "../src/autenticacao/Credencial";
import { PapelUsuario } from "../src/enums/PapelUsuario";
import { FabricaEquipamento } from "../src/fabricas/FabricaEquipamento";
import { TipoEquipamento } from "../src/enums/TipoEquipamento";
import { EstadoFisico } from "../src/enums/EstadoFisico";
import { Equipamento } from "../src/dominio/Equipamento";

function assert(condicao: boolean, mensagem: string): void {
    if (!condicao) {
        throw new Error(mensagem);
    }
}

function esperaErro(executar: () => void, trecho: string): void {
    try {
        executar();
        throw new Error(
            `Esperava falha contendo "${trecho}", mas a operação passou.`
        );
    } catch (erro: unknown) {
        const mensagem =
            erro instanceof Error ? erro.message : String(erro);

        if (!mensagem.includes(trecho)) {
            throw new Error(
                `Esperava "${trecho}", recebeu "${mensagem}".`
            );
        }
    }
}

function main(): void {
    const diretorio = mkdtempSync(
        join(tmpdir(), "greencode-falhas-")
    );

    console.log("Cenários de falha em", diretorio);

    try {
        const criptografia = new CriptografiaArquivo();
        const chave = criptografia.gerarChave();

        JournalTransacao.configurar({
            caminho: join(diretorio, "journal", "journal.log"),
            criptografia,
            chave,
            tamanhoMaximo: 800
        });

        const repositorio = new RepositorioArquivo(
            diretorio,
            criptografia,
            chave
        );

        const journal = new JournalTransacao(
            "BOOT",
            new Date(),
            "INICIALIZACAO",
            "Sistema",
            null,
            null,
            "sistema"
        );

        const servicoOrganizacao = new ServicoOrganizacao(
            repositorio,
            new ValidadorCNPJ(),
            journal
        );

        const servicoLote = new ServicoLote(
            repositorio,
            new ValidadorDataEntrada(),
            journal
        );

        esperaErro(
            () => {
                servicoOrganizacao.cadastrarOrganizacao({
                    razaoSocial: "Inválida",
                    cnpj: "00.000.000/0000-00",
                    inscricaoEstadual: "1",
                    enderecoCompleto: "Rua A",
                    telefone: "1",
                    email: "a@a.com",
                    contrato: {
                        dataVencimento: new Date("2027-01-01"),
                        valorMensal: 10,
                        renovacaoAutomatica: false
                    }
                });
            },
            "CNPJ"
        );

        const futuro = new Date();
        futuro.setDate(futuro.getDate() + 2);

        esperaErro(
            () => {
                servicoLote.criarLote({
                    dataEntrada: futuro,
                    organizacaoId: "BR001",
                    notaFiscal: "1",
                    transportadora: "X"
                });
            },
            "data de entrada"
        );

        const antigo = new Date();
        antigo.setDate(antigo.getDate() - 91);

        esperaErro(
            () => {
                servicoLote.criarLote({
                    dataEntrada: antigo,
                    organizacaoId: "BR001",
                    notaFiscal: "1",
                    transportadora: "X"
                });
            },
            "90"
        );

        const equipamento = FabricaEquipamento.criar({
            id: "EQ-FALHA",
            codigoBarrasInterno: "NOTEBOOK-000001",
            tipo: TipoEquipamento.NOTEBOOK,
            marca: "Demo",
            modelo: "X",
            anoFabricacao: 2021,
            estadoFisico: EstadoFisico.BOM_ESTADO,
            pesoQuilogramas: 1,
            loteId: "L1"
        });

        esperaErro(
            () => {
                equipamento.atualizarEstadoFisico(
                    EstadoFisico.DANIFICADO_LEVE
                );
            },
            "justificativa"
        );

        equipamento.atualizarEstadoFisico(
            EstadoFisico.DANIFICADO_LEVE,
            "Queda de duas categorias com justificativa."
        );

        const autenticacao = new ServicoAutenticacao([
            new Credencial(
                "admin",
                "senha",
                PapelUsuario.ADMINISTRADOR
            )
        ]);

        const sessao = autenticacao.login("admin", "senha");
        (sessao as unknown as { expiracao: Date }).expiracao =
            new Date(0);

        assert(
            autenticacao.validarToken(sessao.getToken()) === false,
            "A sessão expirada deveria ser rejeitada."
        );

        esperaErro(
            () => {
                autenticacao.login("admin", "errada");
            },
            "inválidos"
        );

        repositorio.salvarEntidade("equipamentos.json.enc", {
            id: "EQ-ATOM",
            codigoBarrasInterno: "X"
        });

        const recarregado = repositorio.carregarEntidade(
            "equipamentos.json.enc",
            "EQ-ATOM"
        );

        assert(
            recarregado !== null,
            "A escrita atômica deveria persistir a entidade."
        );

        const temporarios = readdirSync(diretorio).filter(
            (nome) => nome.endsWith(".tmp")
        );

        assert(
            temporarios.length === 0,
            "Arquivos temporários não deveriam permanecer após a escrita atômica."
        );

        for (let i = 0; i < 40; i++) {
            new JournalTransacao(
                `ROT-${i}`,
                new Date(),
                "TESTE_ROTACAO",
                "Journal",
                { i },
                { payload: "x".repeat(80) },
                "sistema"
            ).registrar();
        }

        const diretorioJournal = join(diretorio, "journal");
        assert(
            existsSync(diretorioJournal),
            "O journal deveria existir."
        );

        const rotacionados = readdirSync(diretorioJournal).filter(
            (nome) => nome.startsWith("journal-rotated-")
        );

        assert(
            rotacionados.length > 0,
            "O journal deveria rotacionar ao ultrapassar o limite configurado."
        );

        new Equipamento(
            "EQ-DEP",
            "C",
            TipoEquipamento.MONITOR,
            "M",
            "1",
            2018,
            EstadoFisico.USADO_MODERADO,
            5,
            "L1",
            1
        ).calcularDepreciacao(0.2, 1000);

        console.log("Cenários de falha: PASS");
    } finally {
        rmSync(diretorio, {
            recursive: true,
            force: true
        });
    }
}

main();