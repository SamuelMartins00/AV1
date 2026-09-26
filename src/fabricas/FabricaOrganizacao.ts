import { randomUUID } from "crypto";

import { Organizacao } from "../dominio/Organizacao";
import {
    DadosFabricaContrato,
    FabricaContrato
} from "./FabricaContrato";

export interface DadosFabricaOrganizacao {
    id?: string;
    razaoSocial: string;
    cnpj: string;
    inscricaoEstadual: string;
    enderecoCompleto: string;
    telefone: string;
    email: string;
    dataCadastro?: Date;
    ativo?: boolean;
    contrato: Omit<
        DadosFabricaContrato,
        "organizacaoId"
    >;
}

export class FabricaOrganizacao {
    public static criar(
        dados: DadosFabricaOrganizacao
    ): Organizacao {
        const organizacaoId =
            dados.id ?? randomUUID();

        const contrato =
            FabricaContrato.criar({
                ...dados.contrato,
                organizacaoId
            });

        return new Organizacao(
            organizacaoId,
            dados.razaoSocial,
            dados.cnpj,
            dados.inscricaoEstadual,
            dados.enderecoCompleto,
            dados.telefone,
            dados.email,
            dados.dataCadastro ?? new Date(),
            dados.ativo ?? true,
            contrato
        );
    }
}
