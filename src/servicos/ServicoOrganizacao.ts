import { randomUUID } from "crypto";

import { Organizacao } from "../dominio/Organizacao";
import { Contrato } from "../dominio/Contrato";

import { RepositorioArquivo } from "../persistencia/RepositorioArquivo";
import { ValidadorCNPJ } from "../validadores/ValidadorCNPJ";
import { JournalTransacao } from "../auditoria/JournalTransacao";

interface DadosContrato {
    id?: string;
    dataAssinatura?: string | Date;
    dataVencimento: string | Date;
    clausulas?: string[];
    valorMensal: number;
    renovacaoAutomatica: boolean;
}

interface DadosOrganizacao {
    id?: string;
    razaoSocial: string;
    cnpj: string;
    inscricaoEstadual: string;
    enderecoCompleto: string;
    telefone: string;
    email: string;
    contrato: DadosContrato;
}

export class ServicoOrganizacao {
    private repositorio: RepositorioArquivo;
    private validadorCNPJ: ValidadorCNPJ;
    private journal: JournalTransacao;

    private readonly arquivo =
        "organizacoes.json.enc";

    constructor(
        repositorio: RepositorioArquivo,
        validadorCNPJ: ValidadorCNPJ,
        journal: JournalTransacao
    ) {
        this.repositorio = repositorio;
        this.validadorCNPJ = validadorCNPJ;
        this.journal = journal;
    }

    cadastrarOrganizacao(
        dados: DadosOrganizacao
    ): Organizacao {
        const cnpjLimpo =
            dados.cnpj.replace(/\D/g, "");

        if (!this.validadorCNPJ.validar(cnpjLimpo)) {
            throw new Error(
                this.validadorCNPJ.obterMensagemErro()
            );
        }

        const organizacoes =
            this.repositorio.listarEntidades(
                this.arquivo
            );

        const cnpjExiste =
            organizacoes.some(
                (item) =>
                    item.cnpj === cnpjLimpo
            );

        if (cnpjExiste) {
            throw new Error(
                "Já existe uma organização cadastrada com este CNPJ."
            );
        }

        const organizacaoId =
            dados.id ?? randomUUID();

        const contrato =
            this.criarContrato(
                organizacaoId,
                dados.contrato
            );

        const organizacao =
            new Organizacao(
                organizacaoId,
                dados.razaoSocial,
                cnpjLimpo,
                dados.inscricaoEstadual,
                dados.enderecoCompleto,
                dados.telefone,
                dados.email,
                new Date(),
                true,
                contrato
            );

        this.journal = new JournalTransacao(
            randomUUID(),
            new Date(),
            "CRIAR",
            "Organizacao",
            null,
            organizacao,
            "sistema"
        );

        this.journal.registrar();

        this.repositorio.salvarEntidade(
            this.arquivo,
            this.organizacaoParaJSON(
                organizacao
            )
        );

        return organizacao;
    }

    buscarOrganizacao(
        id: string
    ): Organizacao {
        const dados =
            this.repositorio.carregarEntidade(
                this.arquivo,
                id
            );

        if (!dados) {
            throw new Error(
                `Organização ${id} não encontrada.`
            );
        }

        return this.organizacaoDeJSON(
            dados
        );
    }

    listarOrganizacoesAtivas():
        Organizacao[] {

        const dados =
            this.repositorio.listarEntidades(
                this.arquivo
            );

        return dados
            .filter(
                (item) => item.ativo === true
            )
            .map(
                (item) =>
                    this.organizacaoDeJSON(
                        item
                    )
            );
    }

    renovarContrato(
        organizacaoId: string,
        novoVencimento: Date
    ): void {
        const organizacao =
            this.buscarOrganizacao(
                organizacaoId
            );

        if (!organizacao.contratoVigente) {
            throw new Error(
                "A organização não possui contrato vigente."
            );
        }

        const vencimentoAnterior =
            organizacao.contratoVigente
                .dataVencimento;

        if (
            novoVencimento <=
            vencimentoAnterior
        ) {
            throw new Error(
                "A nova data de vencimento deve ser posterior à atual."
            );
        }

        const dadosAntes =
            this.organizacaoParaJSON(
                organizacao
            );

        organizacao.contratoVigente.renovar(
            novoVencimento
        );

        const dadosDepois =
            this.organizacaoParaJSON(
                organizacao
            );

        this.journal = new JournalTransacao(
            randomUUID(),
            new Date(),
            "RENOVAR_CONTRATO",
            "Organizacao",
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

    private criarContrato(
        organizacaoId: string,
        dados: DadosContrato
    ): Contrato {
        const dataAssinatura =
            dados.dataAssinatura
                ? new Date(dados.dataAssinatura)
                : new Date();

        const dataVencimento =
            new Date(
                dados.dataVencimento
            );

        if (
            isNaN(
                dataAssinatura.getTime()
            ) ||
            isNaN(
                dataVencimento.getTime()
            )
        ) {
            throw new Error(
                "Datas do contrato inválidas."
            );
        }

        if (
            dataVencimento <=
            dataAssinatura
        ) {
            throw new Error(
                "A data de vencimento deve ser posterior à data de assinatura."
            );
        }

        return new Contrato(
            dados.id ?? randomUUID(),
            organizacaoId,
            dataAssinatura,
            dataVencimento,
            dados.clausulas ?? [],
            dados.valorMensal,
            dados.renovacaoAutomatica
        );
    }

    private organizacaoParaJSON(
        organizacao: Organizacao
    ): any {
        return {
            id: organizacao.id,
            razaoSocial:
                organizacao.razaoSocial,
            cnpj: organizacao.cnpj,
            inscricaoEstadual:
                organizacao.inscricaoEstadual,
            enderecoCompleto:
                organizacao.enderecoCompleto,
            telefone:
                organizacao.telefone,
            email:
                organizacao.email,
            dataCadastro:
                organizacao.dataCadastro.toISOString(),
            ativo:
                organizacao.ativo,
            contratoVigente:
                organizacao.contratoVigente
                    ? {
                          id:
                              organizacao
                                  .contratoVigente
                                  .id,

                          organizacaoId:
                              organizacao
                                  .contratoVigente
                                  .organizacaoId,

                          dataAssinatura:
                              organizacao
                                  .contratoVigente
                                  .dataAssinatura
                                  .toISOString(),

                          dataVencimento:
                              organizacao
                                  .contratoVigente
                                  .dataVencimento
                                  .toISOString(),

                          clausulas:
                              organizacao
                                  .contratoVigente
                                  .clausulas,

                          valorMensal:
                              organizacao
                                  .contratoVigente
                                  .valorMensal,

                          renovacaoAutomatica:
                              organizacao
                                  .contratoVigente
                                  .renovacaoAutomatica
                      }
                    : null
        };
    }

    private organizacaoDeJSON(
        dados: any
    ): Organizacao {
        const contratoDados =
            dados.contratoVigente;

        if (!contratoDados) {
            throw new Error(
                "Organização sem contrato vigente."
            );
        }

        const contrato =
            new Contrato(
                contratoDados.id,
                contratoDados.organizacaoId,
                new Date(
                    contratoDados.dataAssinatura
                ),
                new Date(
                    contratoDados.dataVencimento
                ),
                contratoDados.clausulas ?? [],
                contratoDados.valorMensal,
                contratoDados.renovacaoAutomatica
            );

        return new Organizacao(
            dados.id,
            dados.razaoSocial,
            dados.cnpj,
            dados.inscricaoEstadual,
            dados.enderecoCompleto,
            dados.telefone,
            dados.email,
            new Date(dados.dataCadastro),
            dados.ativo,
            contrato
        );
    }
}