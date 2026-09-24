import { randomUUID } from "crypto";

import { PapelUsuario } from "../enums/PapelUsuario";

const TEMPO_SESSAO_MS = 30 * 60 * 1000;

export class Sessao {
    private token: string;
    private usuario: string;
    private papel: PapelUsuario;
    private criacao: Date;
    private expiracao: Date;

    constructor(
        usuario: string,
        papel: PapelUsuario
    ) {
        const agora = new Date();

        this.token = randomUUID();
        this.usuario = usuario;
        this.papel = papel;
        this.criacao = agora;
        this.expiracao = new Date(
            agora.getTime() + TEMPO_SESSAO_MS
        );
    }

    isValida(): boolean {
        return new Date() < this.expiracao;
    }

    renovar(): void {
        const agora = new Date();

        this.expiracao = new Date(
            agora.getTime() + TEMPO_SESSAO_MS
        );
    }

    getToken(): string {
        return this.token;
    }

    getUsuario(): string {
        return this.usuario;
    }

    getPapel(): PapelUsuario {
        return this.papel;
    }

    getCriacao(): Date {
        return this.criacao;
    }

    getExpiracao(): Date {
        return this.expiracao;
    }
}