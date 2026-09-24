import { randomUUID } from "crypto";

import { Lote } from "../dominio/Lote";
import { Equipamento } from "../dominio/Equipamento";

import { RepositorioArquivo } from "../persistencia/RepositorioArquivo";
import { ValidadorDataEntrada } from "../validadores/ValidadorDataEntrada";
import { JournalTransacao } from "../auditoria/JournalTransacao";

import { StatusRastreamento } from "../enums/StatusRastreamento";

interface DadosLote {
    id?: string;
    dataEntrada: string | Date;
    organizacaoId: string;
    notaFiscal: string;
    transportadora: string;
    observacoes?: string;
}

export class ServicoLote {
    private repositorio: RepositorioArquivo;
    private validadorDataEntrada:
        ValidadorDataEntrada;
    private journal: JournalTransacao;

    private readonly arquivoLotes =
        "lotes.json.enc";

    private readonly arquivoEquipamentos =
        "equipamentos.json.enc";

    constructor(
        repositorio: RepositorioArquivo,
        validadorDataEntrada:
            ValidadorDataEntrada,
        journal: JournalTransacao
    ) {
        this.repositorio =
            repositorio;

        this.validadorDataEntrada =
            validadorDataEntrada;

        this.journal =
            journal;
    }

    public criarLote(
        dados: DadosLote
    ): Lote {
        const dataEntrada =
            new Date(
                dados.dataEntrada
            );

        if (
            !this.validadorDataEntrada.validar(
                dataEntrada
            )
        ) {
            throw new Error(
                this.validadorDataEntrada
                    .obterMensagemErro()
            );
        }

        const lote =
            new Lote(
                dados.id ??
                    randomUUID(),
                dataEntrada,
                dados.organizacaoId,
                dados.notaFiscal,
                dados.transportadora,
                [],
                undefined,
                dados.observacoes ??
                    ""
            );

        const dadosDepois =
            this.loteParaJSON(
                lote
            );

        this.journal =
            new JournalTransacao(
                randomUUID(),
                new Date(),
                "CRIAR",
                "Lote",
                null,
                dadosDepois,
                "sistema"
            );

        this.journal.registrar();

        this.repositorio.salvarEntidade(
            this.arquivoLotes,
            dadosDepois
        );

        return lote;
    }

    public adicionarEquipamentoLote(
        loteId: string,
        equipamento: Equipamento
    ): void {
        const lote =
            this.buscarLote(
                loteId
            );

        const dadosAntes =
            this.loteParaJSON(
                lote
            );

        lote.adicionarEquipamento(
            equipamento
        );

        const dadosDepois =
            this.loteParaJSON(
                lote
            );

        this.journal =
            new JournalTransacao(
                randomUUID(),
                new Date(),
                "ADICIONAR_EQUIPAMENTO",
                "Lote",
                dadosAntes,
                dadosDepois,
                "sistema"
            );

        this.journal.registrar();

        this.repositorio.salvarEntidade(
            this.arquivoLotes,
            dadosDepois
        );

        this.repositorio.salvarEntidade(
            this.arquivoEquipamentos,
            this.equipamentoParaJSON(
                equipamento
            )
        );
    }

    public processarTriagem(
        loteId: string
    ): void {
        const lote =
            this.buscarLote(
                loteId
            );

        if (
            lote.getEquipamentos()
                .length === 0
        ) {
            throw new Error(
                "Não é possível concluir a triagem de um lote sem equipamentos."
            );
        }

        const dadosAntes =
            this.loteParaJSON(
                lote
            );

        lote.marcarTriagemConcluida();

        const equipamentos =
            lote.getEquipamentos();

        for (
            const equipamento
            of equipamentos
        ) {
            equipamento.atualizarStatus(
                StatusRastreamento.AGUARDANDO_DESMONTE,
                "Triagem do lote concluída."
            );
        }

        const dadosDepois =
            this.loteParaJSON(
                lote
            );

        this.journal =
            new JournalTransacao(
                randomUUID(),
                new Date(),
                "PROCESSAR_TRIAGEM",
                "Lote",
                dadosAntes,
                dadosDepois,
                "sistema"
            );

        this.journal.registrar();

        this.repositorio.salvarEntidade(
            this.arquivoLotes,
            dadosDepois
        );

        for (
            const equipamento
            of equipamentos
        ) {
            this.repositorio.salvarEntidade(
                this.arquivoEquipamentos,
                this.equipamentoParaJSON(
                    equipamento
                )
            );
        }
    }

    public consultarLotePorPeriodo(
        dataInicio: Date,
        dataFim: Date
    ): Lote[] {
        if (
            dataInicio > dataFim
        ) {
            throw new Error(
                "A data inicial não pode ser posterior à data final."
            );
        }

        const dados =
            this.repositorio.listarEntidades(
                this.arquivoLotes
            );

        return dados
            .map(
                (item) =>
                    this.loteDeJSON(
                        item
                    )
            )
            .filter(
                (lote) =>
                    lote.getDataEntrada() >=
                        dataInicio &&
                    lote.getDataEntrada() <=
                        dataFim
            );
    }

    private buscarLote(
        loteId: string
    ): Lote {
        const dados =
            this.repositorio.carregarEntidade(
                this.arquivoLotes,
                loteId
            );

        if (!dados) {
            throw new Error(
                `Lote ${loteId} não encontrado.`
            );
        }

        return this.loteDeJSON(
            dados
        );
    }

    private loteParaJSON(
        lote: Lote
    ): any {
        return {
            id:
                lote.getId(),

            dataEntrada:
                lote
                    .getDataEntrada()
                    .toISOString(),

            organizacaoId:
                lote.getOrganizacaoId(),

            notaFiscal:
                lote.getNotaFiscal(),

            transportadora:
                lote.getTransportadora(),

            equipamentos:
                lote
                    .getEquipamentos()
                    .map(
                        (equipamento) =>
                            this.equipamentoParaJSON(
                                equipamento
                            )
                    ),

            statusProcessamento:
                lote
                    .getStatusProcessamento(),

            observacoes:
                lote.getObservacoes()
        };
    }

    private loteDeJSON(
        dados: any
    ): Lote {
        const equipamentos =
            Array.isArray(
                dados.equipamentos
            )
                ? dados.equipamentos.map(
                      (item: any) =>
                          this.equipamentoDeJSON(
                              item
                          )
                  )
                : [];

        return new Lote(
            dados.id,
            new Date(
                dados.dataEntrada
            ),
            dados.organizacaoId,
            dados.notaFiscal,
            dados.transportadora,
            equipamentos,
            dados.statusProcessamento,
            dados.observacoes ??
                ""
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
        return new Equipamento(
            dados.id,
            dados.codigoBarrasInterno,
            dados.tipo,
            dados.marca,
            dados.modelo,
            dados.anoFabricacao,
            dados.estadoFisico,
            dados.pesoQuilogramas,
            dados.loteId,
            dados.posicaoNoLote,
            dados.statusRastreamento,
            Array.isArray(
                dados.historicoMovimentacao
            )
                ? dados.historicoMovimentacao.map(
                      (item: any) => ({
                          ...item,
                          dataHora:
                              new Date(
                                  item.dataHora
                              )
                      })
                  )
                : []
        );
    }
}