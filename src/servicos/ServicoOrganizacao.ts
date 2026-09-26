import { randomUUID } from "crypto";

import { Organizacao } from "../dominio/Organizacao";
import { Contrato } from "../dominio/Contrato";

import { RepositorioArquivo } from "../persistencia/RepositorioArquivo";
import { ValidadorCNPJ } from "../validadores/ValidadorCNPJ";
import { JournalTransacao } from "../auditoria/JournalTransacao";
import { FabricaOrganizacao } from "../fabricas/FabricaOrganizacao";

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
        this.repositorio =
            repositorio;

        this.validadorCNPJ =
            validadorCNPJ;

        this.journal =
            journal;
    }

    public cadastrarOrganizacao(
        dados: DadosOrganizacao
    ): Organizacao {
        const cnpjLimpo =
            dados.cnpj.replace(/\D/g, "");

        if (
            !this.validadorCNPJ.validar(
                cnpjLimpo
            )
        ) {
            throw new Error(
                this.validadorCNPJ
                    .obterMensagemErro()
            );
        }

        const organizacoes =
            this.repositorio.listarEntidades(
                this.arquivo
            );

        const cnpjExiste =
            organizacoes.some(
                (item) =>
                    item.cnpj ===
                    cnpjLimpo
            );

        if (cnpjExiste) {
            throw new Error(
                "Já existe uma organização cadastrada com este CNPJ."
            );
        }

        const organizacao =
            FabricaOrganizacao.criar({
                id: dados.id,
                razaoSocial: dados.razaoSocial,
                cnpj: cnpjLimpo,
                inscricaoEstadual:
                    dados.inscricaoEstadual,
                enderecoCompleto:
                    dados.enderecoCompleto,
                telefone: dados.telefone,
                email: dados.email,
                contrato: dados.contrato
            });

        const dadosDepois =
            this.organizacaoParaJSON(
                organizacao
            );

        this.journal =
            new JournalTransacao(
                randomUUID(),
                new Date(),
                "CRIAR",
                "Organizacao",
                null,
                dadosDepois,
                "sistema"
            );

        this.journal.registrar();

        this.repositorio.salvarEntidade(
            this.arquivo,
            dadosDepois
        );

        return organizacao;
    }

    public buscarOrganizacao(
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

    public listarOrganizacoesAtivas():
        Organizacao[] {
        const dados =
            this.repositorio.listarEntidades(
                this.arquivo
            );

        return dados
            .filter(
                (item) =>
                    item.ativo === true
            )
            .map(
                (item) =>
                    this.organizacaoDeJSON(
                        item
                    )
            );
    }

    public renovarContrato(
        organizacaoId: string,
        novoVencimento: Date
    ): void {
        const organizacao =
            this.buscarOrganizacao(
                organizacaoId
            );

        const contrato =
            organizacao
                .getContratoVigente();

        const vencimentoAnterior =
            contrato.getDataVencimento();

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

        contrato.renovar(
            novoVencimento
        );

        const dadosDepois =
            this.organizacaoParaJSON(
                organizacao
            );

        this.journal =
            new JournalTransacao(
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

    private organizacaoParaJSON(
        organizacao: Organizacao
    ): any {
        const contrato =
            organizacao
                .getContratoVigente();

        return {
            id:
                organizacao.getId(),

            razaoSocial:
                organizacao
                    .getRazaoSocial(),

            cnpj:
                organizacao.getCnpj(),

            inscricaoEstadual:
                organizacao
                    .getInscricaoEstadual(),

            enderecoCompleto:
                organizacao
                    .getEnderecoCompleto(),

            telefone:
                organizacao.getTelefone(),

            email:
                organizacao.getEmail(),

            dataCadastro:
                organizacao
                    .getDataCadastro()
                    .toISOString(),

            ativo:
                organizacao.isAtiva(),

            contratoVigente: {
                id:
                    contrato.getId(),

                organizacaoId:
                    contrato
                        .getOrganizacaoId(),

                dataAssinatura:
                    contrato
                        .getDataAssinatura()
                        .toISOString(),

                dataVencimento:
                    contrato
                        .getDataVencimento()
                        .toISOString(),

                clausulas:
                    contrato.getClausulas(),

                valorMensal:
                    contrato
                        .getValorMensal(),

                renovacaoAutomatica:
                    contrato
                        .isRenovacaoAutomatica()
            }
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
                contratoDados.clausulas ??
                    [],
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
            new Date(
                dados.dataCadastro
            ),
            dados.ativo,
            contrato
        );
    }
}