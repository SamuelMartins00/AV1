import { mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

import { CriptografiaArquivo } from "../src/persistencia/CriptografiaArquivo";
import { RepositorioArquivo } from "../src/persistencia/RepositorioArquivo";
import { JournalTransacao } from "../src/auditoria/JournalTransacao";
import { GerenciadorConfiguracaoMestre } from "../src/configuracao/GerenciadorConfiguracaoMestre";
import { Credencial } from "../src/autenticacao/Credencial";
import { ServicoAutenticacao } from "../src/autenticacao/ServicoAutenticacao";
import { ValidadorCNPJ } from "../src/validadores/ValidadorCNPJ";
import { ValidadorDataEntrada } from "../src/validadores/ValidadorDataEntrada";
import { ServicoOrganizacao } from "../src/servicos/ServicoOrganizacao";
import { ServicoLote } from "../src/servicos/ServicoLote";
import { ServicoEquipamento } from "../src/servicos/ServicoEquipamento";
import { ServicoRelatorio } from "../src/servicos/ServicoRelatorio";
import { PapelUsuario } from "../src/enums/PapelUsuario";
import { TipoEquipamento } from "../src/enums/TipoEquipamento";
import { EstadoFisico } from "../src/enums/EstadoFisico";
import { FabricaEquipamento } from "../src/fabricas/FabricaEquipamento";
import { ParametrosGlobais } from "../src/dominio/ParametrosGlobais";
import { StatusRastreamento } from "../src/enums/StatusRastreamento";

function gerarCnpjValido(): string {
    const base = "114447770001";
    const pesos12 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const pesos13 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    const digito = (valor: string, pesos: number[]): string => {
        let soma = 0;

        for (let i = 0; i < valor.length; i++) {
            soma += Number(valor[i]) * pesos[i];
        }

        const resto = soma % 11;
        return String(resto < 2 ? 0 : 11 - resto);
    };

    const d1 = digito(base, pesos12);
    const d2 = digito(base + d1, pesos13);
    return base + d1 + d2;
}

function assert(condicao: boolean, mensagem: string): void {
    if (!condicao) {
        throw new Error(mensagem);
    }
}

function main(): void {
    const diretorio = mkdtempSync(
        join(tmpdir(), "greencode-jornada-")
    );

    console.log("Jornada completa em", diretorio);

    try {
        const criptografia = new CriptografiaArquivo();
        const gerenciador = new GerenciadorConfiguracaoMestre(
            join(diretorio, "configuracao-mestre.json.enc"),
            criptografia
        );

        const configuracao = gerenciador.criar(
            "admin",
            "Admin#123"
        );

        const recarregada = gerenciador.carregar();
        assert(
            recarregada.administrador.usuario === "admin",
            "A configuração mestre não sobreviveu ao recarregamento."
        );

        const parametros = ParametrosGlobais.fromJSON(
            recarregada.parametros
        );

        JournalTransacao.configurar({
            caminho: join(diretorio, "journal", "journal.log"),
            criptografia,
            chave: recarregada.chaveMestra
        });

        const repositorio = new RepositorioArquivo(
            diretorio,
            criptografia,
            recarregada.chaveMestra
        );

        const autenticacao = new ServicoAutenticacao(
            [
                Credencial.fromJSON({
                    usuario: recarregada.administrador.usuario,
                    hashSenha: recarregada.administrador.hashSenha,
                    salt: recarregada.administrador.salt,
                    ultimoAcesso: new Date().toISOString(),
                    papel: recarregada.administrador.papel
                })
            ],
            repositorio
        );

        autenticacao.criarUsuario(
            "gestor",
            "Gestor#123",
            PapelUsuario.GESTOR_ALMOXARIFADO
        );

        autenticacao.criarUsuario(
            "auditor",
            "Auditor#123",
            PapelUsuario.AUDITOR
        );

        const sessaoAdmin = autenticacao.login(
            "admin",
            "Admin#123"
        );

        assert(
            sessaoAdmin.getPapel() === PapelUsuario.ADMINISTRADOR,
            "Login do administrador falhou."
        );

        const journal = new JournalTransacao(
            "BOOT",
            new Date(),
            "INICIALIZACAO",
            "Sistema",
            null,
            null,
            "admin"
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

        const servicoEquipamento = new ServicoEquipamento(
            repositorio,
            journal
        );

        const servicoRelatorio = new ServicoRelatorio(
            repositorio,
            parametros
        );

        const organizacao = servicoOrganizacao.cadastrarOrganizacao({
            id: "BR001",
            razaoSocial: "Geradora Demo LTDA",
            cnpj: gerarCnpjValido(),
            inscricaoEstadual: "123",
            enderecoCompleto: "Rua A, 100",
            telefone: "11999999999",
            email: "contato@demo.com",
            contrato: {
                dataVencimento: new Date("2027-12-31"),
                valorMensal: 1500,
                renovacaoAutomatica: true
            }
        });

        const lote = servicoLote.criarLote({
            id: "LOTE-1",
            dataEntrada: new Date(),
            organizacaoId: organizacao.getId(),
            notaFiscal: "123456",
            transportadora: "TransRapida"
        });

        const equipamento = FabricaEquipamento.criar({
            id: "EQ-1",
            codigoBarrasInterno: servicoEquipamento.gerarCodigoBarras(
                TipoEquipamento.NOTEBOOK,
                1
            ),
            tipo: TipoEquipamento.NOTEBOOK,
            marca: "Demo",
            modelo: "X1",
            anoFabricacao: 2020,
            estadoFisico: EstadoFisico.BOM_ESTADO,
            pesoQuilogramas: 2.1,
            loteId: lote.getId()
        });

        servicoLote.adicionarEquipamentoLote(
            lote.getId(),
            equipamento
        );

        let bloqueouDesmonte = false;

        try {
            equipamento.atualizarStatus(
                StatusRastreamento.EM_DESMONTE,
                "Tentativa antecipada."
            );
        } catch {
            bloqueouDesmonte = true;
        }

        assert(
            bloqueouDesmonte,
            "A movimentação para desmonte deveria ser bloqueada antes da triagem."
        );

        servicoLote.processarTriagem(lote.getId());

        servicoEquipamento.registrarMovimentacao(
            "EQ-1",
            "Desmontagem",
            "gestor",
            "Encaminhado após triagem."
        );

        servicoEquipamento.registrarMovimentacao(
            "EQ-1",
            "Bancada 2",
            "gestor",
            "Segunda movimentação da jornada."
        );

        const historico = servicoEquipamento.rastrearEquipamento(
            "EQ-1"
        );

        assert(
            historico.movimentacoes.length >= 2,
            "O rastreio deveria conter múltiplas movimentações."
        );

        assert(
            historico.equipamento.getStatusRastreamento() ===
                StatusRastreamento.AGUARDANDO_DESMONTE,
            "Após a triagem o equipamento deveria aguardar desmonte."
        );

        servicoEquipamento.atualizarEstadoFisico(
            "EQ-1",
            EstadoFisico.DANIFICADO_LEVE,
            "Queda de duas categorias durante a triagem."
        );

        parametros.definirCoeficienteDepreciacao(0.25);
        parametros.definirAliquota(0.12);
        recarregada.parametros = parametros.toJSON();
        gerenciador.salvar(recarregada);

        const depreciacao = servicoEquipamento.calcularDepreciacao(
            "EQ-1",
            parametros
        );

        assert(
            depreciacao.depreciacaoAcumulada > 0,
            "A depreciação deveria produzir um valor acumulado."
        );

        const relatorio = servicoRelatorio.gerarRelatorioFinanceiro({
            inicio: new Date("2020-01-01"),
            fim: new Date("2030-01-01")
        });

        assert(
            relatorio.includes("12.00%"),
            "O relatório financeiro deveria refletir a alíquota configurada."
        );

        autenticacao.logout(sessaoAdmin.getToken());

        const sessaoAuditor = autenticacao.login(
            "auditor",
            "Auditor#123"
        );

        assert(
            sessaoAuditor.getPapel() === PapelUsuario.AUDITOR,
            "Login do auditor falhou."
        );

        console.log("Jornada completa: PASS");
        console.log("Organização:", organizacao.getId());
        console.log("Lote:", lote.getId());
        console.log("Equipamento:", historico.equipamento.getId());
        console.log(
            "Movimentações:",
            historico.movimentacoes.length
        );
        console.log(
            "Depreciação acumulada: R$",
            depreciacao.depreciacaoAcumulada.toFixed(2)
        );
    } finally {
        rmSync(diretorio, {
            recursive: true,
            force: true
        });
    }
}

main();