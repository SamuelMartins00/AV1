import {
    existsSync,
    readFileSync,
    writeFileSync,
    openSync,
    fsyncSync,
    closeSync,
    renameSync,
    unlinkSync,
    mkdirSync
} from "fs";

import { dirname } from "path";

import { CriptografiaArquivo } from "../persistencia/CriptografiaArquivo";
import { Credencial } from "../autenticacao/Credencial";
import { PapelUsuario } from "../enums/PapelUsuario";

interface AdministradorConfiguracao {
    usuario: string;
    hashSenha: string;
    salt: string;
    papel: PapelUsuario;
}

export interface ConfiguracaoMestre {
    versao: number;
    chaveMestra: string;
    administrador: AdministradorConfiguracao;
}

export class GerenciadorConfiguracaoMestre {
    private caminhoArquivo: string;
    private criptografia: CriptografiaArquivo;

    constructor(
        caminhoArquivo: string,
        criptografia: CriptografiaArquivo
    ) {
        this.caminhoArquivo = caminhoArquivo;
        this.criptografia = criptografia;
    }

    existe(): boolean {
        return existsSync(this.caminhoArquivo);
    }

    carregar(): ConfiguracaoMestre {
        if (!this.existe()) {
            throw new Error(
                "Arquivo de configuração mestre não encontrado."
            );
        }

        try {
            const conteudo = readFileSync(
                this.caminhoArquivo,
                "utf8"
            );

            const configuracao: ConfiguracaoMestre =
                JSON.parse(conteudo);

            this.validarConfiguracao(configuracao);

            return configuracao;
        } catch (erro) {
            if (erro instanceof Error) {
                throw new Error(
                    `Erro ao carregar a configuração mestre: ${erro.message}`
                );
            }

            throw new Error(
                "Erro desconhecido ao carregar a configuração mestre."
            );
        }
    }

    criar(
        usuarioAdministrador: string,
        senhaAdministrador: string
    ): ConfiguracaoMestre {
        const chaveMestra =
            this.criptografia.gerarChave();

        const credencial = new Credencial(
            usuarioAdministrador,
            senhaAdministrador,
            PapelUsuario.ADMINISTRADOR
        );

        const configuracao: ConfiguracaoMestre = {
            versao: 1,
            chaveMestra,
            administrador: {
                usuario: credencial.getUsuario(),
                hashSenha: credencial.getHashSenha(),
                salt: credencial.getSalt(),
                papel: credencial.getPapel()
            }
        };

        this.salvarAtomicamente(configuracao);

        return configuracao;
    }

    private validarConfiguracao(
        configuracao: ConfiguracaoMestre
    ): void {
        if (
            !configuracao ||
            typeof configuracao !== "object"
        ) {
            throw new Error(
                "Configuração mestre inválida."
            );
        }

        if (
            typeof configuracao.versao !== "number"
        ) {
            throw new Error(
                "Versão da configuração inválida."
            );
        }

        if (
            typeof configuracao.chaveMestra !== "string" ||
            configuracao.chaveMestra.trim() === ""
        ) {
            throw new Error(
                "Chave mestra não encontrada."
            );
        }

        if (
            !configuracao.administrador
        ) {
            throw new Error(
                "Administrador inicial não encontrado."
            );
        }

        if (
            typeof configuracao.administrador.usuario !== "string" ||
            typeof configuracao.administrador.hashSenha !== "string" ||
            typeof configuracao.administrador.salt !== "string"
        ) {
            throw new Error(
                "Dados do administrador estão inválidos."
            );
        }

        if (
            configuracao.administrador.papel !==
            PapelUsuario.ADMINISTRADOR
        ) {
            throw new Error(
                "O administrador inicial precisa possuir o papel ADMINISTRADOR."
            );
        }
    }

    private salvarAtomicamente(
        configuracao: ConfiguracaoMestre
    ): void {
        const diretorio =
            dirname(this.caminhoArquivo);

        if (!existsSync(diretorio)) {
            mkdirSync(diretorio, {
                recursive: true
            });
        }

        const caminhoTemporario =
            `${this.caminhoArquivo}.${process.pid}.tmp`;

        const conteudo =
            JSON.stringify(
                configuracao,
                null,
                2
            );

        let fd: number | null = null;

        try {
            fd = openSync(
                caminhoTemporario,
                "w",
                0o600
            );

            writeFileSync(
                fd,
                conteudo,
                "utf8"
            );

            fsyncSync(fd);

            closeSync(fd);
            fd = null;

            renameSync(
                caminhoTemporario,
                this.caminhoArquivo
            );
        } catch (erro) {
            if (fd !== null) {
                closeSync(fd);
            }

            if (
                existsSync(caminhoTemporario)
            ) {
                unlinkSync(caminhoTemporario);
            }

            if (erro instanceof Error) {
                throw new Error(
                    `Não foi possível salvar a configuração mestre: ${erro.message}`
                );
            }

            throw new Error(
                "Não foi possível salvar a configuração mestre."
            );
        }
    }
}