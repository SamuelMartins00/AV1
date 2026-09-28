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
import {
    ParametrosGlobais,
    ParametrosGlobaisPersistidos
} from "../dominio/ParametrosGlobais";

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
    parametros: ParametrosGlobaisPersistidos;
}

export class GerenciadorConfiguracaoMestre {
    // A chave que protege o arquivo mestre pode ser sobrescrita pela
    // variável de ambiente GREENCODE_BOOTSTRAP_KEY. Sem ela, usa-se o
    // valor padrão (compatível com instalações existentes).
    private static readonly CHAVE_BOOTSTRAP =
        process.env.GREENCODE_BOOTSTRAP_KEY ||
        "GREENCODE_BOOTSTRAP_V1";

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
            const bruto = readFileSync(
                this.caminhoArquivo,
                "utf8"
            );

            const conteudo =
                this.decifrarOuLerTexto(
                    bruto
                );

            const lida = JSON.parse(
                conteudo
            ) as ConfiguracaoMestre;

            const configuracao: ConfiguracaoMestre =
                {
                    ...lida,
                    parametros:
                        ParametrosGlobais.fromJSON(
                            lida.parametros
                        ).toJSON()
                };

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
            },
            parametros:
                ParametrosGlobais.padrao().toJSON()
        };

        this.salvarAtomicamente(configuracao);

        return configuracao;
    }

    public salvar(
        configuracao: ConfiguracaoMestre
    ): void {
        this.validarConfiguracao(configuracao);
        this.salvarAtomicamente(configuracao);
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

        ParametrosGlobais.fromJSON(
            configuracao.parametros
        );
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
            this.criptografia.cifrar(
                JSON.stringify(
                    configuracao,
                    null,
                    2
                ),
                GerenciadorConfiguracaoMestre
                    .CHAVE_BOOTSTRAP
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

    private decifrarOuLerTexto(
        bruto: string
    ): string {
        try {
            return this.criptografia.decifrar(
                bruto,
                GerenciadorConfiguracaoMestre
                    .CHAVE_BOOTSTRAP
            );
        } catch {
            const lida = JSON.parse(
                bruto
            ) as Partial<ConfiguracaoMestre>;

            if (
                typeof lida.chaveMestra ===
                    "string" &&
                lida.administrador
            ) {
                return bruto;
            }

            throw new Error(
                "Não foi possível decifrar a configuração mestre."
            );
        }
    }
}