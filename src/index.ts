import { existsSync } from "fs";

import {
    CriptografiaArquivo
} from "./persistencia/CriptografiaArquivo";

import {
    RepositorioArquivo
} from "./persistencia/RepositorioArquivo";

import {
    JournalTransacao
} from "./auditoria/JournalTransacao";

import {
    GerenciadorConfiguracaoMestre
} from "./configuracao/GerenciadorConfiguracaoMestre";

import {
    provisionar
} from "./configuracao/ProvisionamentoInicial";

import {
    Credencial
} from "./autenticacao/Credencial";

import {
    ServicoAutenticacao
} from "./autenticacao/ServicoAutenticacao";

import {
    ValidadorCNPJ
} from "./validadores/ValidadorCNPJ";

import {
    ValidadorDataEntrada
} from "./validadores/ValidadorDataEntrada";

import {
    ServicoOrganizacao
} from "./servicos/ServicoOrganizacao";

import {
    ServicoLote
} from "./servicos/ServicoLote";

import {
    ServicoEquipamento
} from "./servicos/ServicoEquipamento";

import {
    ServicoRelatorio
} from "./servicos/ServicoRelatorio";

import {
    CLIInterface
} from "./cli/CLIInterface";

async function main(): Promise<void> {
    console.log(
        "Inicializando GREENCODE..."
    );

    const criptografia =
        new CriptografiaArquivo();

    const gerenciadorConfig =
        new GerenciadorConfiguracaoMestre(
            "./data/configuracao-mestre.json",
            criptografia
        );

    let configuracao;

    if (
        gerenciadorConfig.existe()
    ) {
        console.log(
            "Configuração mestre encontrada."
        );

        configuracao =
            gerenciadorConfig.carregar();
    } else {
        configuracao =
            await provisionar(
                gerenciadorConfig
            );
    }

    const repositorio =
        new RepositorioArquivo(
            "./data",
            criptografia,
            configuracao.chaveMestra
        );

    const arquivoCredenciais =
        "credenciais.json.enc";

    let credenciais: Credencial[] = [];

    if (
        existsSync(
            "./data/" +
                arquivoCredenciais
        )
    ) {
        const dados =
            repositorio.listarEntidades(
                arquivoCredenciais
            );

        credenciais =
            dados.map(
                (item) =>
                    Credencial.fromJSON(
                        item
                    )
            );
    }

    const administradorExiste =
        credenciais.some(
            (credencial) =>
                credencial.getUsuario() ===
                configuracao.administrador.usuario
        );

    if (
        !administradorExiste
    ) {
        const administrador =
            Credencial.fromJSON({
                usuario:
                    configuracao
                        .administrador
                        .usuario,

                hashSenha:
                    configuracao
                        .administrador
                        .hashSenha,

                salt:
                    configuracao
                        .administrador
                        .salt,

                ultimoAcesso:
                    new Date().toISOString(),

                papel:
                    configuracao
                        .administrador
                        .papel
            });

        credenciais.push(
            administrador
        );

        repositorio.salvarEntidade(
            arquivoCredenciais,
            administrador.toJSON()
        );

        console.log(
            "Administrador inicial registrado."
        );
    }

    console.log(
        `Credenciais carregadas: ${credenciais.length}`
    );

    const autenticacao =
        new ServicoAutenticacao(
            credenciais
        );

    const journal =
        new JournalTransacao(
            "BOOT",
            new Date(),
            "INICIALIZACAO",
            "Sistema",
            null,
            null,
            "sistema"
        );

    const validadorCNPJ =
        new ValidadorCNPJ();

    const validadorDataEntrada =
        new ValidadorDataEntrada();

    const servicoOrganizacao =
        new ServicoOrganizacao(
            repositorio,
            validadorCNPJ,
            journal
        );

    const servicoLote =
        new ServicoLote(
            repositorio,
            validadorDataEntrada,
            journal
        );

    const servicoEquipamento =
        new ServicoEquipamento(
            repositorio,
            journal
        );

    const servicoRelatorio =
        new ServicoRelatorio(
            repositorio
        );

    const cli =
        new CLIInterface(
            autenticacao,
            servicoOrganizacao,
            servicoLote,
            servicoEquipamento,
            servicoRelatorio
        );

    console.log(
        "GREENCODE pronto."
    );

    await cli.iniciarLoop();
}

main().catch(
    (erro: unknown) => {
        console.error();
        console.error(
            "[ERRO FATAL]",
            erro instanceof Error
                ? erro.message
                : "Erro desconhecido."
        );

        process.exitCode = 1;
    }
);