import {
    createHash,
    randomBytes,
    timingSafeEqual
} from "crypto";

import { PapelUsuario } from "../enums/PapelUsuario";

export class Credencial {
    private usuario: string;
    private hashSenha: string;
    private salt: string;
    private ultimoAcesso: Date;
    private papel: PapelUsuario;

    constructor(
        usuario: string,
        senhaPlana: string,
        papel: PapelUsuario
    ) {
        this.usuario = usuario;
        this.salt = randomBytes(16).toString("hex");
        this.hashSenha = this.gerarHash(senhaPlana);
        this.ultimoAcesso = new Date();
        this.papel = papel;
    }

    verificarSenha(senhaPlana: string): boolean {
        const hashInformado = this.gerarHash(senhaPlana);

        const hashEsperado = Buffer.from(
            this.hashSenha,
            "hex"
        );

        const hashRecebido = Buffer.from(
            hashInformado,
            "hex"
        );

        if (hashEsperado.length !== hashRecebido.length) {
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

    getPapel(): PapelUsuario {
        return this.papel;
    }

    getUltimoAcesso(): Date {
        return this.ultimoAcesso;
    }

    private gerarHash(senhaPlana: string): string {
        return createHash("sha256")
            .update(this.salt + senhaPlana, "utf8")
            .digest("hex");
    }
}