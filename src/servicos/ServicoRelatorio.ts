import { RepositorioArquivo } from "../persistencia/RepositorioArquivo";

import { StatusRastreamento } from "../enums/StatusRastreamento";

interface Periodo {
    inicio: Date;
    fim: Date;
}

interface DadosContratoRelatorio {
    id: string;
    organizacaoId: string;
    dataAssinatura: string;
    dataVencimento: string;
    clausulas: string[];
    valorMensal: number;
    renovacaoAutomatica: boolean;
}

interface DadosOrganizacaoRelatorio {
    id: string;
    razaoSocial: string;
    cnpj: string;
    ativo: boolean;
    dataCadastro: string;
    contratoVigente: DadosContratoRelatorio;
}

export class ServicoRelatorio {
    private repositorio: RepositorioArquivo;

    private readonly arquivoOrganizacoes =
        "organizacoes.json.enc";

    private readonly arquivoLotes =
        "lotes.json.enc";

    private readonly arquivoEquipamentos =
        "equipamentos.json.enc";

    constructor(
        repositorio: RepositorioArquivo
    ) {
        this.repositorio = repositorio;
    }

    public gerarRelatorioPorOrganizacao(
        organizacaoId: string,
        periodo: Periodo
    ): string {
        this.validarPeriodo(periodo);

        const organizacao =
            this.carregarOrganizacao(
                organizacaoId
            );

        if (!organizacao) {
            throw new Error(
                `Organização ${organizacaoId} não encontrada.`
            );
        }

        const lotes =
            this.repositorio.listarEntidades(
                this.arquivoLotes
            );

        const lotesDoPeriodo =
            lotes.filter(
                (lote: any) =>
                    lote.organizacaoId ===
                        organizacaoId &&
                    this.dataDentroDoPeriodo(
                        new Date(
                            lote.dataEntrada
                        ),
                        periodo
                    )
            );

        const equipamentos =
            lotesDoPeriodo.flatMap(
                (lote: any) =>
                    Array.isArray(
                        lote.equipamentos
                    )
                        ? lote.equipamentos
                        : []
            );

        const pesoTotal =
            equipamentos.reduce(
                (
                    total: number,
                    equipamento: any
                ) =>
                    total +
                    Number(
                        equipamento
                            .pesoQuilogramas ??
                            0
                    ),
                0
            );

        const quantidadePorStatus =
            this.contarStatus(
                equipamentos
            );

        const inicio =
            periodo.inicio.toLocaleDateString(
                "pt-BR"
            );

        const fim =
            periodo.fim.toLocaleDateString(
                "pt-BR"
            );

        const linhasStatus =
            Object.entries(
                quantidadePorStatus
            )
                .map(
                    ([status, quantidade]) =>
                        `  ${status}: ${quantidade}`
                )
                .join("\n");

        return [
            "==============================================",
            "       RELATÓRIO POR ORGANIZAÇÃO",
            "==============================================",
            `Organização: ${organizacao.razaoSocial}`,
            `ID: ${organizacao.id}`,
            `CNPJ: ${organizacao.cnpj}`,
            `Período: ${inicio} a ${fim}`,
            "",
            `Lotes recebidos: ${lotesDoPeriodo.length}`,
            `Equipamentos recebidos: ${equipamentos.length}`,
            `Peso total: ${pesoTotal.toFixed(2)} kg`,
            "",
            "Equipamentos por status:",
            linhasStatus || "  Nenhum equipamento.",
            "=============================================="
        ].join("\n");
    }

    public gerarRelatorioPorStatus(
        status: StatusRastreamento
    ): string {
        const equipamentos =
            this.repositorio.listarEntidades(
                this.arquivoEquipamentos
            );

        const encontrados =
            equipamentos.filter(
                (equipamento: any) =>
                    equipamento.statusRastreamento ===
                    status
            );

        const linhas =
            encontrados.map(
                (equipamento: any) =>
                    `  ${equipamento.id} | ` +
                    `${equipamento.codigoBarrasInterno} | ` +
                    `${equipamento.marca} ${equipamento.modelo} | ` +
                    `Lote: ${equipamento.loteId}`
            );

        return [
            "==============================================",
            "        RELATÓRIO POR STATUS",
            "==============================================",
            `Status consultado: ${status}`,
            `Quantidade encontrada: ${encontrados.length}`,
            "",
            linhas.length > 0
                ? linhas.join("\n")
                : "Nenhum equipamento encontrado.",
            "=============================================="
        ].join("\n");
    }

    public gerarRelatorioFinanceiro(
        periodo: Periodo
    ): string {
        this.validarPeriodo(periodo);

        const organizacoes =
            this.repositorio.listarEntidades(
                this.arquivoOrganizacoes
            ) as DadosOrganizacaoRelatorio[];

        const contratosNoPeriodo =
            organizacoes.filter(
                (
                    organizacao
                ) => {
                    const contrato =
                        organizacao
                            .contratoVigente;

                    if (!contrato) {
                        return false;
                    }

                    const assinatura =
                        new Date(
                            contrato
                                .dataAssinatura
                        );

                    const vencimento =
                        new Date(
                            contrato
                                .dataVencimento
                        );

                    return (
                        assinatura <=
                            periodo.fim &&
                        vencimento >=
                            periodo.inicio
                    );
                }
            );

        const valorMensalTotal =
            contratosNoPeriodo.reduce(
                (
                    total,
                    organizacao
                ) =>
                    total +
                    Number(
                        organizacao
                            .contratoVigente
                            .valorMensal ??
                            0
                    ),
                0
            );

        const mediaValorMensal =
            contratosNoPeriodo.length > 0
                ? valorMensalTotal /
                  contratosNoPeriodo.length
                : 0;

        const linhas =
            contratosNoPeriodo.map(
                (
                    organizacao
                ) =>
                    `  ${organizacao.razaoSocial} | ` +
                    `R$ ${Number(
                        organizacao
                            .contratoVigente
                            .valorMensal
                    ).toFixed(2)} / mês`
            );

        return [
            "==============================================",
            "           RELATÓRIO FINANCEIRO",
            "==============================================",
            `Período: ${periodo.inicio.toLocaleDateString(
                "pt-BR"
            )} a ${periodo.fim.toLocaleDateString(
                "pt-BR"
            )}`,
            "",
            `Contratos no período: ${contratosNoPeriodo.length}`,
            `Valor mensal contratado total: R$ ${valorMensalTotal.toFixed(
                2
            )}`,
            `Valor mensal médio por organização: R$ ${mediaValorMensal.toFixed(
                2
            )}`,
            "",
            "Contratos considerados:",
            linhas.length > 0
                ? linhas.join("\n")
                : "  Nenhum contrato encontrado.",
            "",
            "Observação: este relatório apresenta",
            "valores contratuais mensais. A atividade",
            "não define uma regra de reconhecimento",
            "de receita.",
            "=============================================="
        ].join("\n");
    }

    private validarPeriodo(
        periodo: Periodo
    ): void {
        if (
            !(periodo.inicio instanceof Date) ||
            isNaN(periodo.inicio.getTime())
        ) {
            throw new Error(
                "A data inicial do período é inválida."
            );
        }

        if (
            !(periodo.fim instanceof Date) ||
            isNaN(periodo.fim.getTime())
        ) {
            throw new Error(
                "A data final do período é inválida."
            );
        }

        if (
            periodo.inicio >
            periodo.fim
        ) {
            throw new Error(
                "A data inicial não pode ser posterior à data final."
            );
        }
    }

    private dataDentroDoPeriodo(
        data: Date,
        periodo: Periodo
    ): boolean {
        return (
            data >= periodo.inicio &&
            data <= periodo.fim
        );
    }

    private carregarOrganizacao(
        id: string
    ): DadosOrganizacaoRelatorio | null {
        return this.repositorio.carregarEntidade(
            this.arquivoOrganizacoes,
            id
        );
    }

    private contarStatus(
        equipamentos: any[]
    ): Record<string, number> {
        const resultado:
            Record<string, number> = {};

        for (
            const equipamento
            of equipamentos
        ) {
            const status =
                equipamento.statusRastreamento;

            if (
                typeof status !==
                "string"
            ) {
                continue;
            }

            resultado[status] =
                (resultado[status] ?? 0) + 1;
        }

        return resultado;
    }
}