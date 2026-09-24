import { randomUUID } from "crypto";

import { TipoEquipamento } from "../enums/TipoEquipamento";
import { EstadoFisico } from "../enums/EstadoFisico";
import { StatusRastreamento } from "../enums/StatusRastreamento";
import { Movimentacao } from "./Movimentacao";

export class Equipamento {
    private id: string;
    private codigoBarrasInterno: string;
    private tipo: TipoEquipamento;
    private marca: string;
    private modelo: string;
    private anoFabricacao: number;
    private estadoFisico: EstadoFisico;
    private pesoQuilogramas: number;
    private loteId: string;
    private posicaoNoLote: number;
    private statusRastreamento: StatusRastreamento;
    private historicoMovimentacao: Movimentacao[];

    constructor(
        id: string,
        codigoBarrasInterno: string,
        tipo: TipoEquipamento,
        marca: string,
        modelo: string,
        anoFabricacao: number,
        estadoFisico: EstadoFisico,
        pesoQuilogramas: number,
        loteId: string,
        posicaoNoLote: number,
        statusRastreamento:
            StatusRastreamento =
            StatusRastreamento.AGUARDANDO_TRIAGEM,
        historicoMovimentacao:
            Movimentacao[] = []
    ) {
        this.id = id;
        this.codigoBarrasInterno =
            codigoBarrasInterno;
        this.tipo = tipo;
        this.marca = marca;
        this.modelo = modelo;
        this.anoFabricacao =
            anoFabricacao;
        this.estadoFisico =
            estadoFisico;
        this.pesoQuilogramas =
            pesoQuilogramas;
        this.loteId = loteId;
        this.posicaoNoLote =
            posicaoNoLote;
        this.statusRastreamento =
            statusRastreamento;
        this.historicoMovimentacao =
            historicoMovimentacao;
    }

    public atualizarStatus(
        novoStatus: StatusRastreamento,
        justificativa: string
    ): void {
        if (!justificativa.trim()) {
            throw new Error(
                "A justificativa não pode ser vazia."
            );
        }

        this.statusRastreamento =
            novoStatus;
    }

    public registrarMovimentacao(
        destino: string,
        responsavel: string
    ): void {
        if (!destino.trim()) {
            throw new Error(
                "O destino não pode ser vazio."
            );
        }

        if (!responsavel.trim()) {
            throw new Error(
                "O responsável não pode ser vazio."
            );
        }

        const ultimaMovimentacao =
            this.historicoMovimentacao[
                this.historicoMovimentacao.length - 1
            ];

        const origem =
            ultimaMovimentacao?.getDestino()
            ?? "ORIGEM";

        const movimentacao =
            new Movimentacao(
                randomUUID(),
                this.id,
                new Date(),
                origem,
                destino,
                responsavel,
                ""
            );

        this.historicoMovimentacao.push(
            movimentacao
        );
    }

    public calcularDepreciacao(): number {
        throw new Error(
            "Regra de cálculo de depreciação ainda não implementada."
        );
    }

    public definirLote(
        loteId: string,
        posicao: number
    ): void {
        this.loteId = loteId;
        this.posicaoNoLote = posicao;
    }

    public getId(): string {
        return this.id;
    }

    public getCodigoBarrasInterno(): string {
        return this.codigoBarrasInterno;
    }

    public getTipo(): TipoEquipamento {
        return this.tipo;
    }

    public getMarca(): string {
        return this.marca;
    }

    public getModelo(): string {
        return this.modelo;
    }

    public getAnoFabricacao(): number {
        return this.anoFabricacao;
    }

    public getEstadoFisico(): EstadoFisico {
        return this.estadoFisico;
    }

    public getPesoQuilogramas(): number {
        return this.pesoQuilogramas;
    }

    public getLoteId(): string {
        return this.loteId;
    }

    public getPosicaoNoLote(): number {
        return this.posicaoNoLote;
    }

    public getStatusRastreamento():
        StatusRastreamento {
        return this.statusRastreamento;
    }

    public getHistoricoMovimentacao():
        Movimentacao[] {
        return [
            ...this.historicoMovimentacao
        ];
    }
}