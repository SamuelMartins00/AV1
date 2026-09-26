import { randomUUID } from "crypto";

import { Equipamento } from "../dominio/Equipamento";
import { Movimentacao } from "../dominio/Movimentacao";

import { TipoEquipamento } from "../enums/TipoEquipamento";
import { EstadoFisico } from "../enums/EstadoFisico";

import { RepositorioArquivo } from "../persistencia/RepositorioArquivo";
import { JournalTransacao } from "../auditoria/JournalTransacao";

import { FabricaEquipamento } from "../fabricas/FabricaEquipamento";
import { ParametrosGlobais } from "../dominio/ParametrosGlobais";

export interface HistoricoCompleto {
    equipamento: Equipamento;
    movimentacoes: Movimentacao[];
}

export class ServicoEquipamento {
    private repositorio: RepositorioArquivo;
    private journal: JournalTransacao;

    private readonly arquivo =
        "equipamentos.json.enc";

    constructor(
        repositorio: RepositorioArquivo,
        journal: JournalTransacao
    ) {
        this.repositorio =
            repositorio;

        this.journal =
            journal;
    }

    public rastrearEquipamento(
        id: string
    ): HistoricoCompleto {
        const dados =
            this.repositorio.carregarEntidade(
                this.arquivo,
                id
            );

        if (!dados) {
            throw new Error(
                `Equipamento ${id} não encontrado.`
            );
        }

        const equipamento =
            this.equipamentoDeJSON(
                dados
            );

        return {
            equipamento,
            movimentacoes:
                equipamento
                    .getHistoricoMovimentacao()
        };
    }

    public atualizarEstadoFisico(
        id: string,
        novoEstado: EstadoFisico,
        justificativa: string = ""
    ): void {
        const equipamento =
            this.buscarEquipamento(id);

        const dadosAntes =
            this.equipamentoParaJSON(
                equipamento
            );

        equipamento.atualizarEstadoFisico(
            novoEstado,
            justificativa
        );

        const dadosDepois =
            this.equipamentoParaJSON(
                equipamento
            );

        this.journal =
            new JournalTransacao(
                randomUUID(),
                new Date(),
                "ATUALIZAR_ESTADO_FISICO",
                "Equipamento",
                dadosAntes,
                dadosDepois,
                "sistema"
            );

        this.journal.registrar();

        this.repositorio.salvarEntidade(
            this.arquivo,
            dadosDepois
        );
    }

    public gerarCodigoBarras(
        tipo: TipoEquipamento,
        sequencia: number
    ): string {
        if (
            !Number.isInteger(sequencia) ||
            sequencia <= 0
        ) {
            throw new Error(
                "A sequência do código de barras deve ser um número inteiro positivo."
            );
        }

        const numero =
            sequencia
                .toString()
                .padStart(6, "0");

        return `${tipo}-${numero}`;
    }

    public registrarMovimentacao(
        id: string,
        destino: string,
        responsavel: string,
        observacao: string = ""
    ): void {
        const dados =
            this.repositorio.carregarEntidade(
                this.arquivo,
                id
            );

        if (
            dados === null ||
            dados === undefined
        ) {
            throw new Error(
                `Equipamento ${id} não encontrado.`
            );
        }

        const equipamento =
            this.equipamentoDeJSON(
                dados
            );

        const dadosAntes =
            this.equipamentoParaJSON(
                equipamento
            );

        equipamento.registrarMovimentacao(
            destino,
            responsavel,
            observacao
        );

        const dadosDepois =
            this.equipamentoParaJSON(
                equipamento
            );

        this.journal =
            new JournalTransacao(
                randomUUID(),
                new Date(),
                "REGISTRAR_MOVIMENTACAO",
                "Equipamento",
                dadosAntes,
                dadosDepois,
                responsavel
            );

        this.journal.registrar();

        this.repositorio.salvarEntidade(
            this.arquivo,
            dadosDepois
        );
    }

    private buscarEquipamento(
        id: string
    ): Equipamento {
        const dados =
            this.repositorio.carregarEntidade(
                this.arquivo,
                id
            );

        if (!dados) {
            throw new Error(
                `Equipamento ${id} não encontrado.`
            );
        }

        return this.equipamentoDeJSON(
            dados
        );
    }

    private equipamentoParaJSON(
        equipamento: Equipamento
    ): any {
        return {
            id:
                equipamento.getId(),

            codigoBarrasInterno:
                equipamento
                    .getCodigoBarrasInterno(),

            tipo:
                equipamento.getTipo(),

            marca:
                equipamento.getMarca(),

            modelo:
                equipamento.getModelo(),

            anoFabricacao:
                equipamento
                    .getAnoFabricacao(),

            estadoFisico:
                equipamento
                    .getEstadoFisico(),

            pesoQuilogramas:
                equipamento
                    .getPesoQuilogramas(),

            loteId:
                equipamento.getLoteId(),

            posicaoNoLote:
                equipamento
                    .getPosicaoNoLote(),

            statusRastreamento:
                equipamento
                    .getStatusRastreamento(),

            historicoMovimentacao:
                equipamento
                    .getHistoricoMovimentacao()
                    .map(
                        (movimentacao) => ({
                            id:
                                movimentacao
                                    .getId(),

                            equipamentoId:
                                movimentacao
                                    .getEquipamentoId(),

                            dataHora:
                                movimentacao
                                    .getDataHora()
                                    .toISOString(),

                            origem:
                                movimentacao
                                    .getOrigem(),

                            destino:
                                movimentacao
                                    .getDestino(),

                            responsavel:
                                movimentacao
                                    .getResponsavel(),

                            observacao:
                                movimentacao
                                    .getObservacao()
                        })
                    )
        };
    }

    private equipamentoDeJSON(
        dados: any
    ): Equipamento {
        const movimentacoes =
            Array.isArray(
                dados.historicoMovimentacao
            )
                ? dados.historicoMovimentacao.map(
                    (item: any) =>
                        new Movimentacao(
                            item.id,
                            item.equipamentoId,
                            new Date(
                                item.dataHora
                            ),
                            item.origem,
                            item.destino,
                            item.responsavel,
                            item.observacao ?? ""
                        )
                )
                : [];

        return FabricaEquipamento.criar({
            id: dados.id,
            codigoBarrasInterno:
                dados.codigoBarrasInterno,
            tipo: dados.tipo,
            marca: dados.marca,
            modelo: dados.modelo,
            anoFabricacao: dados.anoFabricacao,
            estadoFisico: dados.estadoFisico,
            pesoQuilogramas:
                dados.pesoQuilogramas,
            loteId: dados.loteId,
            posicaoNoLote: dados.posicaoNoLote,
            statusRastreamento:
                dados.statusRastreamento,
            historicoMovimentacao: movimentacoes
        });
    }

    public calcularDepreciacao(
        id: string,
        parametros: ParametrosGlobais
    ): {
        equipamentoId: string;
        depreciacaoAcumulada: number;
        coeficiente: number;
        valorBase: number;
    } {
        const equipamento =
            this.buscarEquipamento(id);

        const depreciacaoAcumulada =
            equipamento.calcularDepreciacao(
                parametros.getCoeficienteDepreciacao(),
                parametros.getValorBaseDepreciacao()
            );

        return {
            equipamentoId: equipamento.getId(),
            depreciacaoAcumulada,
            coeficiente:
                parametros.getCoeficienteDepreciacao(),
            valorBase:
                parametros.getValorBaseDepreciacao()
        };
    }
}