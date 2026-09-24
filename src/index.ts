import { existsSync } from "fs";

import { CriptografiaArquivo } from "./persistencia/CriptografiaArquivo";
import { RepositorioArquivo } from "./persistencia/RepositorioArquivo";

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

async function main(): Promise<void> {
    console.log(
        "================================="
    );
    console.log(
        "        GREENCODE CLI"
    );
    console.log(
        "================================="
    );

    const criptografia =
        new CriptografiaArquivo();

    const gerenciadorConfig =
        new GerenciadorConfiguracaoMestre(
            "./data/configuracao-mestre.json",
            criptografia
        );

    let configuracao;

    if (gerenciadorConfig.existe()) {
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

    let credenciais: Credencial[] = [];

    const arquivoCredenciais =
        "credenciais.json.enc";

    if (
        existsSync(
            "./data/" + arquivoCredenciais
        )
    ) {
        const dados =
            repositorio.listarEntidades(
                arquivoCredenciais
            );

        credenciais =
            dados.map(
                (dadosCredencial) =>
                    Credencial.fromJSON(
                        dadosCredencial
                    )
            );
    }

    const administradorExiste =
        credenciais.some(
            (credencial) =>
                credencial.getUsuario() ===
                configuracao.administrador.usuario
        );

    if (!administradorExiste) {
        const administrador =
            Credencial.fromJSON({
                usuario:
                    configuracao.administrador.usuario,

                hashSenha:
                    configuracao.administrador.hashSenha,

                salt:
                    configuracao.administrador.salt,

                ultimoAcesso:
                    new Date().toISOString(),

                papel:
                    configuracao.administrador.papel
            });

        credenciais.push(administrador);

        repositorio.salvarEntidade(
            arquivoCredenciais,
            administrador.toJSON()
        );

        console.log(
            "Administrador inicial registrado nas credenciais."
        );
    }

    const autenticacao =
        new ServicoAutenticacao(
            credenciais
        );

    console.log();
    console.log(
        "Sistema preparado."
    );
    console.log(
        `Usuários carregados: ${credenciais.length}`
    );
    console.log();

    const usuario =
        await perguntarLogin(
            autenticacao
        );

    console.log();
    console.log(
        `Bem-vindo, ${usuario}.`
    );
}

async function perguntarLogin(
    autenticacao: ServicoAutenticacao
): Promise<string> {
    const readline =
        await import("readline");

    const interfaceTerminal =
        readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

    const perguntar = (
        pergunta: string
    ): Promise<string> =>
        new Promise(
            (resolve) => {
                interfaceTerminal.question(
                    pergunta,
                    resolve
                );
            }
        );

    try {
        const usuario =
            await perguntar("Usuário: ");

        const senha =
            await perguntar("Senha: ");

        const sessao =
            autenticacao.login(
                usuario,
                senha
            );

        console.log();
        console.log(
            "Login realizado com sucesso."
        );
        console.log(
            "Papel:",
            sessao.getPapel()
        );

        return sessao.getUsuario();
    } finally {
        interfaceTerminal.close();
    }
}

main().catch(
    (erro: unknown) => {
        console.error();
        console.error(
            "ERRO:",
            erro instanceof Error
                ? erro.message
                : "Erro desconhecido."
        );

        process.exitCode = 1;
    }
);