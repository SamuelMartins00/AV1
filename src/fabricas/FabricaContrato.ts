import { randomUUID } from "crypto";

import { Contrato } from "../dominio/Contrato";

export interface DadosFabricaContrato {
    id?: string;
    organizacaoId: string;
    dataAssinatura?: string | Date;
    dataVencimento: string | Date;
    clausulas?: string[];
    valorMensal: number;
    renovacaoAutomatica: boolean;
}

export class FabricaContrato {
    public static criar(
        dados: DadosFabricaContrato
    ): Contrato {
        const dataAssinatura =
            dados.dataAssinatura
                ? new Date(dados.dataAssinatura)
                : new Date();

        const dataVencimento =
            new Date(dados.dataVencimento);

        if (
            isNaN(dataAssinatura.getTime()) ||
            isNaN(dataVencimento.getTime())
        ) {
            throw new Error(
                "Datas do contrato inválidas."
            );
        }

        if (dataVencimento <= dataAssinatura) {
            throw new Error(
                "A data de vencimento deve ser posterior à data de assinatura."
            );
        }

        if (
            !Number.isFinite(dados.valorMensal) ||
            dados.valorMensal < 0
        ) {
            throw new Error(
                "O valor mensal do contrato é inválido."
            );
        }

        return new Contrato(
            dados.id ?? randomUUID(),
            dados.organizacaoId,
            dataAssinatura,
            dataVencimento,
            dados.clausulas ?? [],
            dados.valorMensal,
            dados.renovacaoAutomatica
        );
    }
}
