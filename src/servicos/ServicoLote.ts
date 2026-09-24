import { randomUUID } from "crypto";

import { Lote } from "../dominio/Lote";
import { Equipamento } from "../dominio/Equipamento";

import { RepositorioArquivo } from "../persistencia/RepositorioArquivo";
import { ValidadorDataEntrada } from "../validadores/ValidadorDataEntrada";
import { JournalTransacao } from "../auditoria/JournalTransacao";

import { StatusLote } from "../enums/StatusLote";
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
    private validadorDataEntrada: ValidadorDataEntrada;
    private journal: JournalTransacao;

    private readonly arquivoLotes =
        "lotes.json.enc";

    private readonly arquivoEquipamentos =
        "equipamentos.json.enc";

    constructor(
        repositorio: RepositorioArquivo,
        validadorDataEntrada: ValidadorDataEntrada,
        journal: JournalTransacao
    ) {
        this.repositorio = repositorio;
        this.validadorDataEntrada =
            validadorDataEntrada;
        this.journal = journal;
    }

    criarLote(
        dados: DadosLote
    ): Lote {
        const dataEntrada =
            new Date(dados.dataEntrada);

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

        const lote = new Lote(
            dados.id ?? randomUUID(),
            dataEntrada,
            dados.organizacaoId,
            dados.notaFiscal,
            dados.transportadora,
            [],
            undefined,
            dados.observacoes ?? ""
        );

        this.journal = new JournalTransacao(
            randomUUID(),
            new Date(),
            "CRIAR",
            "Lote",
            null,
            this.loteParaJSON(lote),
            "sistema"
        );

        this.journal.registrar();

        this.repositorio.salvarEntidade(
            this.arquivoLotes,
            this.loteParaJSON(lote)
        );

        return lote;
    }

    adicionarEquipamentoLote(
        loteId: string,
        equipamento: Equipamento
    ): void {
        const lote =
            this.buscarLote(loteId);

        const dadosAntes =
            this.loteParaJSON(lote);

        lote.adicionarEquipamento(
            equipamento
        );

        const dadosDepois =
            this.loteParaJSON(lote);

        this.journal = new JournalTransacao(
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

    processarTriagem(
        loteId: string
    ): void {
        const lote =
            this.buscarLote(loteId);

        const dadosAntes =
            this.loteParaJSON(lote);

        if (
            lote.equipamentos.length === 0
        ) {
            throw new Error(
                "Não é possível concluir a triagem de um lote sem equipamentos."
            );
        }

        lote.statusProcessamento =
            StatusLote.TRIAGEM_CONCLUIDA;

        for (
            const equipamento
            of lote.equipamentos
        ) {
            equipamento.atualizarStatus(
                StatusRastreamento.AGUARDANDO_DESMONTE,
                "Triagem do lote concluída."
            );
        }

        const dadosDepois =
            this.loteParaJSON(lote);

        this.journal = new JournalTransacao(
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
            of lote.equipamentos
        ) {
            this.repositorio.salvarEntidade(
                this.arquivoEquipamentos,
                this.equipamentoParaJSON(
                    equipamento
                )
            );
        }
    }

    consultarLotePorPeriodo(
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
                    this.loteDeJSON(item)
            )
            .filter(
                (lote) =>
                    lote.dataEntrada >=
                    dataInicio &&
                    lote.dataEntrada <=
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

        return this.loteDeJSON(dados);
    }

    private loteParaJSON(
        lote: Lote
    ): any {
        return {
            id: lote.id,
            dataEntrada:
                lote.dataEntrada.toISOString(),
            organizacaoId:
                lote.organizacaoId,
            notaFiscal:
                lote.notaFiscal,
            transportadora:
                lote.transportadora,
            equipamentos:
                lote.equipamentos.map(
                    (equipamento) =>
                        this.equipamentoParaJSON(
                            equipamento
                        )
                ),
            statusProcessamento:
                lote.statusProcessamento,
            observacoes:
                lote.observacoes
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
            dados.observacoes ?? ""
        );
    }

    private equipamentoParaJSON(
        equipamento: Equipamento
    ): any {
        return {
            id:
                equipamento.id,

            codigoBarrasInterno:
                equipamento.codigoBarrasInterno,

            tipo:
                equipamento.tipo,

            marca:
                equipamento.marca,

            modelo:
                equipamento.modelo,

            anoFabricacao:
                equipamento.anoFabricacao,

            estadoFisico:
                equipamento.estadoFisico,

            pesoQuilogramas:
                equipamento.pesoQuilogramas,

            loteId:
                equipamento.loteId,

            posicaoNoLote:
                equipamento.posicaoNoLote,

            statusRastreamento:
                equipamento.statusRastreamento,

            historicoMovimentacao:
                equipamento
                    .historicoMovimentacao
                    .map(
                        (movimentacao) => ({
                            ...movimentacao,
                            dataHora:
                                movimentacao.dataHora.toISOString()
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
                ? dados.historicoMovimentacao
                    .map(
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