import {
    createInterface
} from "readline";

import {
    ConfiguracaoMestre,
    GerenciadorConfiguracaoMestre
} from "./GerenciadorConfiguracaoMestre";

function perguntar(
    pergunta: string
): Promise<string> {
    const readline =
        createInterface({
            input: process.stdin,
            output: process.stdout
        });

    return new Promise(
        (resolve) => {
            readline.question(
                pergunta,
                (resposta) => {
                    readline.close();
                    resolve(resposta);
                }
            );
        }
    );
}

export async function provisionar(
    gerenciador:
        GerenciadorConfiguracaoMestre
): Promise<ConfiguracaoMestre> {
    console.log();
    console.log(
        "================================="
    );
    console.log(
        "   PROVISIONAMENTO INICIAL"
    );
    console.log(
        "================================="
    );
    console.log();
    console.log(
        "Nenhuma configuração mestre foi encontrada."
    );
    console.log(
        "Vamos criar o primeiro administrador."
    );
    console.log();

    const usuario =
        await perguntar(
            "Usuário do administrador: "
        );

    if (!usuario.trim()) {
        throw new Error(
            "O usuário do administrador não pode ser vazio."
        );
    }

    const senha =
        await perguntar(
            "Senha do administrador: "
        );

    if (!senha) {
        throw new Error(
            "A senha do administrador não pode ser vazia."
        );
    }

    const confirmacao =
        await perguntar(
            "Confirme a senha: "
        );

    if (senha !== confirmacao) {
        throw new Error(
            "As senhas não coincidem."
        );
    }

    const configuracao =
        gerenciador.criar(
            usuario.trim(),
            senha
        );

    console.log();
    console.log(
        "Configuração mestre criada com sucesso."
    );
    console.log(
        "Administrador inicial:",
        usuario.trim()
    );
    console.log();

    return configuracao;
}