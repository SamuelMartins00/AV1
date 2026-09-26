import {
    existsSync,
    mkdirSync,
    statSync,
    readdirSync,
    renameSync,
    unlinkSync,
    openSync,
    writeSync,
    fsyncSync,
    closeSync
} from "fs";

import {
    basename,
    dirname,
    join,
    resolve
} from "path";

import { CriptografiaArquivo } from "../persistencia/CriptografiaArquivo";

const TAMANHO_MAXIMO_JOURNAL = 10 * 1024 * 1024;
const RETENCAO_DIAS = 180;

interface ConfiguracaoJournal {
    caminhoPadrao: string;
    criptografia: CriptografiaArquivo | null;
    chave: string | null;
    tamanhoMaximo: number;
    retencaoDias: number;
}

export class JournalTransacao {
    private static configuracao: ConfiguracaoJournal = {
        caminhoPadrao: "./data/journal/journal.log",
        criptografia: null,
        chave: null,
        tamanhoMaximo: TAMANHO_MAXIMO_JOURNAL,
        retencaoDias: RETENCAO_DIAS
    };

    private id: string;
    private timestamp: Date;
    private operacao: string;
    private entidade: string;
    private dadosAntes: any;
    private dadosDepois: any;
    private usuarioResponsavel: string;

    private caminhoJournal: string;

    public static configurar(
        opcoes: {
            caminho?: string;
            criptografia?: CriptografiaArquivo;
            chave?: string;
            tamanhoMaximo?: number;
            retencaoDias?: number;
        }
    ): void {
        if (opcoes.caminho) {
            JournalTransacao.configuracao.caminhoPadrao =
                opcoes.caminho;
        }

        if (opcoes.criptografia) {
            JournalTransacao.configuracao.criptografia =
                opcoes.criptografia;
        }

        if (opcoes.chave) {
            JournalTransacao.configuracao.chave =
                opcoes.chave;
        }

        if (
            typeof opcoes.tamanhoMaximo ===
                "number" &&
            opcoes.tamanhoMaximo > 0
        ) {
            JournalTransacao.configuracao.tamanhoMaximo =
                opcoes.tamanhoMaximo;
        }

        if (
            typeof opcoes.retencaoDias ===
                "number" &&
            opcoes.retencaoDias > 0
        ) {
            JournalTransacao.configuracao.retencaoDias =
                opcoes.retencaoDias;
        }
    }

    constructor(
        id: string,
        timestamp: Date,
        operacao: string,
        entidade: string,
        dadosAntes: any,
        dadosDepois: any,
        usuarioResponsavel: string,
        caminhoJournal: string =
            JournalTransacao.configuracao.caminhoPadrao
    ) {
        this.id = id;
        this.timestamp = timestamp;
        this.operacao = operacao;
        this.entidade = entidade;
        this.dadosAntes = dadosAntes;
        this.dadosDepois = dadosDepois;
        this.usuarioResponsavel = usuarioResponsavel;
        this.caminhoJournal = resolve(
            caminhoJournal
        );

        this.garantirDiretorio();
    }

    registrar(): void {
        const registro = {
            id: this.id,
            timestamp: this.timestamp.toISOString(),
            operacao: this.operacao,
            entidade: this.entidade,
            dadosAntes: this.dadosAntes,
            dadosDepois: this.dadosDepois,
            usuarioResponsavel:
                this.usuarioResponsavel
        };

        let conteudo: string;

        try {
            conteudo =
                JSON.stringify(registro);
        } catch {
            throw new Error(
                "Não foi possível serializar a transação."
            );
        }

        const criptografia =
            JournalTransacao.configuracao.criptografia;
        const chave =
            JournalTransacao.configuracao.chave;

        if (criptografia && chave) {
            conteudo = criptografia.cifrar(
                conteudo,
                chave
            );
        }

        const linha = conteudo + "\n";

        this.anexarAoJournal(linha);

        this.rotacionarSeNecessario();
        this.aplicarRetencao();
    }

    reverter(): boolean {
        if (
            this.dadosAntes === undefined ||
            this.dadosAntes === null
        ) {
            return false;
        }

        this.dadosDepois =
            this.dadosAntes;

        return true;
    }

    private anexarAoJournal(
        linha: string
    ): void {
        let fd: number | null = null;

        try {
            fd = openSync(
                this.caminhoJournal,
                "a",
                0o600
            );

            writeSync(
                fd,
                linha,
                undefined,
                "utf8"
            );

            fsyncSync(fd);
        } catch (erro) {
            if (erro instanceof Error) {
                throw new Error(
                    `Não foi possível registrar a transação: ${erro.message}`
                );
            }

            throw new Error(
                "Não foi possível registrar a transação."
            );
        } finally {
            if (fd !== null) {
                closeSync(fd);
            }
        }
    }

    private rotacionarSeNecessario(): void {
        if (
            !existsSync(this.caminhoJournal)
        ) {
            return;
        }

        const tamanhoAtual =
            statSync(
                this.caminhoJournal
            ).size;

        if (
            tamanhoAtual <=
            JournalTransacao.configuracao
                .tamanhoMaximo
        ) {
            return;
        }

        const diretorio =
            dirname(this.caminhoJournal);

        const nomeOriginal =
            basename(
                this.caminhoJournal
            );

        const caminhoRotacionado =
            join(
                diretorio,
                `journal-rotated-${Date.now()}-${process.pid}-${Math.random()
                    .toString(16)
                    .slice(2)}.log`
            );

        renameSync(
            this.caminhoJournal,
            caminhoRotacionado
        );
    }

    private aplicarRetencao(): void {
        const diretorio =
            dirname(this.caminhoJournal);

        const agora =
            Date.now();

        const limite =
            agora -
            JournalTransacao.configuracao
                .retencaoDias *
                24 *
                60 *
                60 *
                1000;

        const arquivos =
            readdirSync(
                diretorio
            );

        for (const arquivo of arquivos) {
            if (
                !arquivo.startsWith(
                    "journal-rotated-"
                ) ||
                !arquivo.endsWith(".log")
            ) {
                continue;
            }

            const caminho =
                join(
                    diretorio,
                    arquivo
                );

            try {
                const dados =
                    statSync(caminho);

                if (
                    dados.mtimeMs <
                    limite
                ) {
                    unlinkSync(caminho);
                }
            } catch {
                // Ignora arquivos que tenham
                // desaparecido durante a limpeza.
            }
        }
    }

    private garantirDiretorio(): void {
        const diretorio =
            dirname(
                this.caminhoJournal
            );

        if (
            !existsSync(diretorio)
        ) {
            mkdirSync(
                diretorio,
                {
                    recursive: true
                }
            );
        }
    }
}