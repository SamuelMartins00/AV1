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

        if (
            novoStatus ===
            StatusRastreamento.EM_DESMONTE &&
            this.statusRastreamento !==
            StatusRastreamento.AGUARDANDO_DESMONTE
        ) {
            throw new Error(
                "O equipamento só pode entrar em desmonte após a triagem completa."
            );
        }

        this.statusRastreamento =
            novoStatus;
    }

    public registrarMovimentacao(
        destino: string,
        responsavel: string,
        observacao: string = ""
    ): void {
        const destinoLimpo =
            destino.trim();

        const responsavelLimpo =
            responsavel.trim();

        const observacaoLimpa =
            observacao.trim();

        if (destinoLimpo === "") {
            throw new Error(
                "O destino da movimentação é obrigatório."
            );
        }

        if (responsavelLimpo === "") {
            throw new Error(
                "O responsável pela movimentação é obrigatório."
            );
        }

        const ultimaMovimentacao =
            this.historicoMovimentacao[
            this.historicoMovimentacao.length - 1
            ];

        const origem =
            ultimaMovimentacao !== undefined
                ? ultimaMovimentacao.getDestino()
                : "Entrada";

        const movimentacao =
            new Movimentacao(
                randomUUID(),
                this.id,
                new Date(),
                origem,
                destinoLimpo,
                responsavelLimpo,
                observacaoLimpa
            );

        this.historicoMovimentacao.push(
            movimentacao
        );
    }

    public definirLote(
        loteId: string,
        posicao: number
    ): void {
        this.loteId = loteId;
        this.posicaoNoLote = posicao;
    }

    public atualizarEstadoFisico(
        novoEstado: EstadoFisico,
        justificativa: string = ""
    ): void {
        const indiceAtual =
            this.obterIndiceEstado(
                this.estadoFisico
            );

        const novoIndice =
            this.obterIndiceEstado(
                novoEstado
            );

        const queda =
            novoIndice - indiceAtual;

        if (
            queda >= 2 &&
            !justificativa.trim()
        ) {
            throw new Error(
                "É obrigatória uma justificativa quando o estado físico piora duas ou mais categorias."
            );
        }

        this.estadoFisico =
            novoEstado;
    }

    private obterIndiceEstado(
        estado: EstadoFisico
    ): number {
        switch (estado) {
            case EstadoFisico.NOVO:
                return 0;

            case EstadoFisico.BOM_ESTADO:
                return 1;

            case EstadoFisico.USADO_LEVE:
                return 2;

            case EstadoFisico.USADO_MODERADO:
                return 3;

            case EstadoFisico.DANIFICADO_LEVE:
                return 4;

            case EstadoFisico.DANIFICADO_GRAVE:
                return 5;

            case EstadoFisico.INSERVIVEL:
                return 6;
        }
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