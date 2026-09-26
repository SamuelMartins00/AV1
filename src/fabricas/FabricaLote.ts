import { randomUUID } from "crypto";

import { Lote } from "../dominio/Lote";
import { Equipamento } from "../dominio/Equipamento";
import { StatusLote } from "../enums/StatusLote";

export interface DadosFabricaLote {
    id?: string;
    dataEntrada: Date;
    organizacaoId: string;
    notaFiscal: string;
    transportadora: string;
    equipamentos?: Equipamento[];
    statusProcessamento?: StatusLote;
    observacoes?: string;
}

export class FabricaLote {
    public static criar(
        dados: DadosFabricaLote
    ): Lote {
        return new Lote(
            dados.id ?? randomUUID(),
            dados.dataEntrada,
            dados.organizacaoId,
            dados.notaFiscal,
            dados.transportadora,
            dados.equipamentos ?? [],
            dados.statusProcessamento ??
                StatusLote.RECEBIDO,
            dados.observacoes ?? ""
        );
    }
}
