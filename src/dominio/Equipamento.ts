import { TipoEquipamento } from "../enums/TipoEquipamento";
import { EstadoFisico } from "../enums/EstadoFisico";
import { StatusRastreamento } from "../enums/StatusRastreamento";
import { Movimentacao } from "./Movimentacao";

export class Equipamento {
    id: string;
    codigoBarrasInterno: string;
    tipo: TipoEquipamento;
    marca: string;
    modelo: string;
    anoFabricacao: number;
    estadoFisico: EstadoFisico;
    pesoQuilogramas: number;
    loteId: string;
    posicaoNoLote: number;
    statusRastreamento: StatusRastreamento;
    historicoMovimentacao: Movimentacao[];

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
        statusRastreamento: StatusRastreamento = StatusRastreamento.AGUARDANDO_TRIAGEM,
        historicoMovimentacao: Movimentacao[] = []
    ) {
        this.id = id;
        this.codigoBarrasInterno = codigoBarrasInterno;
        this.tipo = tipo;
        this.marca = marca;
        this.modelo = modelo;
        this.anoFabricacao = anoFabricacao;
        this.estadoFisico = estadoFisico;
        this.pesoQuilogramas = pesoQuilogramas;
        this.loteId = loteId;
        this.posicaoNoLote = posicaoNoLote;
        this.statusRastreamento = statusRastreamento;
        this.historicoMovimentacao = historicoMovimentacao;
    }

    atualizarStatus(
        novoStatus: StatusRastreamento,
        justificativa: string
    ): void {
        if (!justificativa.trim()) {
            throw new Error("A justificativa não pode ser vazia.");
        }

        this.statusRastreamento = novoStatus;
    }

    registrarMovimentacao(
        destino: string,
        responsavel: string
    ): void {
        const ultimaMovimentacao =
            this.historicoMovimentacao[
                this.historicoMovimentacao.length - 1
            ];

        const origem = ultimaMovimentacao?.destino ?? "ORIGEM";

        const movimentacao = new Movimentacao(
            crypto.randomUUID(),
            this.id,
            new Date(),
            origem,
            destino,
            responsavel,
            ""
        );

        this.historicoMovimentacao.push(movimentacao);
    }

    calcularDepreciacao(): number {
        throw new Error(
            "Regra de cálculo de depreciação ainda não implementada."
        );
    }
}