import {
    createHash,
    randomBytes,
    timingSafeEqual
} from "crypto";

import { PapelUsuario } from "../enums/PapelUsuario";

export interface CredencialPersistida {
    usuario: string;
    hashSenha: string;
    salt: string;
    ultimoAcesso: string;
    papel: PapelUsuario;
}

export class Credencial {
    private usuario: string;
    private hashSenha: string;
    private salt: string;
    private ultimoAcesso: Date;
    private papel: PapelUsuario;

    constructor(
        usuario: string,
        senhaPlana: string,
        papel: PapelUsuario,
        dadosPersistidos?: {
            hashSenha: string;
            salt: string;
            ultimoAcesso: Date;
        }
    ) {
        this.usuario = usuario;
        this.papel = papel;

        if (dadosPersistidos) {
            this.hashSenha =
                dadosPersistidos.hashSenha;

            this.salt =
                dadosPersistidos.salt;

            this.ultimoAcesso =
                dadosPersistidos.ultimoAcesso;
        } else {
            this.salt =
                randomBytes(16).toString("hex");

            this.hashSenha =
                this.gerarHash(senhaPlana);

            this.ultimoAcesso = new Date();
        }
    }

    verificarSenha(
        senhaPlana: string
    ): boolean {
        const hashInformado =
            this.gerarHash(senhaPlana);

        const hashEsperado =
            Buffer.from(
                this.hashSenha,
                "hex"
            );

        const hashRecebido =
            Buffer.from(
                hashInformado,
                "hex"
            );

        if (
            hashEsperado.length !==
            hashRecebido.length
        ) {
            return false;
        }

        return timingSafeEqual(
            hashEsperado,
            hashRecebido
        );
    }

    atualizarUltimoAcesso(): void {
        this.ultimoAcesso = new Date();
    }

    getUsuario(): string {
        return this.usuario;
    }

    getHashSenha(): string {
        return this.hashSenha;
    }

    getSalt(): string {
        return this.salt;
    }

    getPapel(): PapelUsuario {
        return this.papel;
    }

    getUltimoAcesso(): Date {
        return this.ultimoAcesso;
    }

    toJSON(): CredencialPersistida {
        return {
            usuario: this.usuario,
            hashSenha: this.hashSenha,
            salt: this.salt,
            ultimoAcesso:
                this.ultimoAcesso.toISOString(),
            papel: this.papel
        };
    }

    static fromJSON(
        dados: CredencialPersistida
    ): Credencial {
        return new Credencial(
            dados.usuario,
            "",
            dados.papel,
            {
                hashSenha: dados.hashSenha,
                salt: dados.salt,
                ultimoAcesso:
                    new Date(dados.ultimoAcesso)
            }
        );
    }

    private gerarHash(
        senhaPlana: string
    ): string {
        return createHash("sha256")
            .update(
                this.salt + senhaPlana,
                "utf8"
            )
            .digest("hex");
    }
}