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

// Lê a senha sem exibi-la no terminal. Se stdin não for TTY
// (ex.: execução automatizada), recorre à leitura normal.
function perguntarSenha(
    pergunta: string
): Promise<string> {
    const stdin = process.stdin;

    if (!stdin.isTTY || !stdin.setRawMode) {
        return perguntar(pergunta);
    }

    return new Promise((resolve, reject) => {
        let senha = "";

        process.stdout.write(pergunta);
        stdin.setRawMode(true);
        stdin.resume();
        stdin.setEncoding("utf8");

        const encerrar = () => {
            stdin.setRawMode(false);
            stdin.pause();
            stdin.removeListener("data", aoReceber);
            process.stdout.write("\n");
        };

        const aoReceber = (tecla: string) => {
            for (const c of tecla) {
                if (c === "\u0003") {
                    encerrar();
                    reject(new Error("Provisionamento cancelado."));
                    return;
                }

                if (c === "\r" || c === "\n") {
                    encerrar();
                    resolve(senha);
                    return;
                }

                if (c === "\u007f" || c === "\b") {
                    senha = senha.slice(0, -1);
                } else {
                    senha += c;
                }
            }
        };

        stdin.on("data", aoReceber);
    });
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
        await perguntarSenha(
            "Senha do administrador: "
        );

    if (!senha) {
        throw new Error(
            "A senha do administrador não pode ser vazia."
        );
    }

    const confirmacao =
        await perguntarSenha(
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