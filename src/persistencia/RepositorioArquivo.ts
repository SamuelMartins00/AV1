import {
    existsSync,
    mkdirSync,
    readFileSync,
    renameSync,
    unlinkSync,
    writeFileSync,
    openSync,
    fsyncSync,
    closeSync
} from "fs";

import {
    basename,
    join,
    resolve
} from "path";

import { CriptografiaArquivo } from "./CriptografiaArquivo";

export class RepositorioArquivo {
    private diretorioBase: string;
    private criptografia: CriptografiaArquivo;
    private chave: string;

    constructor(
        diretorioBase: string,
        criptografia: CriptografiaArquivo,
        chave: string
    ) {
        this.diretorioBase = resolve(diretorioBase);
        this.criptografia = criptografia;
        this.chave = chave;

        this.garantirDiretorio();
    }

    salvarEntidade(
        nomeArquivo: string,
        entidade: any
    ): void {
        const caminho =
            this.obterCaminhoSeguro(nomeArquivo);

        const entidades =
            this.listarEntidades(nomeArquivo);

        const identificador =
            this.obterIdentificador(entidade);

        if (!identificador) {
            throw new Error(
                "A entidade precisa possuir um identificador."
            );
        }

        const indice = entidades.findIndex(
            (item) =>
                this.obterIdentificador(item) ===
                identificador
        );

        if (indice >= 0) {
            entidades[indice] = entidade;
        } else {
            entidades.push(entidade);
        }

        const conteudoJson =
            JSON.stringify(
                entidades,
                null,
                2
            );

        const conteudoCriptografado =
            this.criptografia.cifrar(
                conteudoJson,
                this.chave
            );

        this.gravarAtomicamente(
            caminho,
            conteudoCriptografado
        );
    }

    carregarEntidade(
        nomeArquivo: string,
        id: string
    ): any {
        const entidades =
            this.listarEntidades(nomeArquivo);

        return (
            entidades.find(
                (entidade) =>
                    this.obterIdentificador(entidade) ===
                    id
            ) ?? null
        );
    }

    listarEntidades(
        nomeArquivo: string
    ): any[] {
        const caminho =
            this.obterCaminhoSeguro(nomeArquivo);

        if (!existsSync(caminho)) {
            return [];
        }

        try {
            const arquivoCriptografado =
                readFileSync(
                    caminho,
                    "utf8"
                );

            if (
                arquivoCriptografado.trim()
                    .length === 0
            ) {
                return [];
            }

            const conteudo =
                this.criptografia.decifrar(
                    arquivoCriptografado,
                    this.chave
                );

            const entidades =
                JSON.parse(conteudo);

            if (!Array.isArray(entidades)) {
                throw new Error(
                    "O conteúdo do arquivo não é uma lista."
                );
            }

            return entidades;
        } catch (erro) {
            if (erro instanceof Error) {
                throw new Error(
                    `Erro ao ler ${nomeArquivo}: ${erro.message}`
                );
            }

            throw new Error(
                `Erro desconhecido ao ler ${nomeArquivo}.`
            );
        }
    }

    excluirEntidade(
        nomeArquivo: string,
        id: string
    ): void {
        const caminho =
            this.obterCaminhoSeguro(nomeArquivo);

        if (!existsSync(caminho)) {
            return;
        }

        const entidades =
            this.listarEntidades(nomeArquivo);

        const entidadesRestantes =
            entidades.filter(
                (entidade) =>
                    this.obterIdentificador(entidade) !==
                    id
            );

        if (
            entidadesRestantes.length ===
            entidades.length
        ) {
            return;
        }

        const conteudoJson =
            JSON.stringify(
                entidadesRestantes,
                null,
                2
            );

        const conteudoCriptografado =
            this.criptografia.cifrar(
                conteudoJson,
                this.chave
            );

        this.gravarAtomicamente(
            caminho,
            conteudoCriptografado
        );
    }

    private obterIdentificador(
        entidade: any
    ): string | null {
        if (
            entidade &&
            typeof entidade.id === "string" &&
            entidade.id.trim() !== ""
        ) {
            return entidade.id;
        }

        if (
            entidade &&
            typeof entidade.usuario === "string" &&
            entidade.usuario.trim() !== ""
        ) {
            return entidade.usuario;
        }

        return null;
    }

    private garantirDiretorio(): void {
        if (!existsSync(this.diretorioBase)) {
            mkdirSync(
                this.diretorioBase,
                {
                    recursive: true
                }
            );
        }
    }

    private obterCaminhoSeguro(
        nomeArquivo: string
    ): string {
        const nomeSeguro =
            basename(nomeArquivo);

        if (
            nomeSeguro !== nomeArquivo ||
            nomeSeguro.includes("..") ||
            nomeSeguro.includes("/") ||
            nomeSeguro.includes("\\")
        ) {
            throw new Error(
                "Nome de arquivo inválido."
            );
        }

        return join(
            this.diretorioBase,
            nomeSeguro
        );
    }

    private gravarAtomicamente(
        caminhoFinal: string,
        conteudo: string
    ): void {
        const nomeTemporario =
            `.${basename(caminhoFinal)}.${Date.now()}.${process.pid}.tmp`;

        const caminhoTemporario =
            join(
                this.diretorioBase,
                nomeTemporario
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
                caminhoFinal
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
                    `Não foi possível salvar o arquivo: ${erro.message}`
                );
            }

            throw new Error(
                "Não foi possível salvar o arquivo."
            );
        }
    }
}