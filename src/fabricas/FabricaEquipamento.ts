import { randomUUID } from "crypto";

import { Equipamento } from "../dominio/Equipamento";
import { Movimentacao } from "../dominio/Movimentacao";
import { TipoEquipamento } from "../enums/TipoEquipamento";
import { EstadoFisico } from "../enums/EstadoFisico";
import { StatusRastreamento } from "../enums/StatusRastreamento";

export interface DadosFabricaEquipamento {
    id?: string;
    codigoBarrasInterno: string;
    tipo: TipoEquipamento;
    marca: string;
    modelo: string;
    anoFabricacao: number;
    estadoFisico: EstadoFisico;
    pesoQuilogramas: number;
    loteId: string;
    posicaoNoLote?: number;
    statusRastreamento?: StatusRastreamento;
    historicoMovimentacao?: Movimentacao[];
}

export class FabricaEquipamento {
    public static criar(
        dados: DadosFabricaEquipamento
    ): Equipamento {
        return new Equipamento(
            dados.id ?? randomUUID(),
            dados.codigoBarrasInterno,
            dados.tipo,
            dados.marca,
            dados.modelo,
            dados.anoFabricacao,
            dados.estadoFisico,
            dados.pesoQuilogramas,
            dados.loteId,
            dados.posicaoNoLote ?? 1,
            dados.statusRastreamento ??
                StatusRastreamento.AGUARDANDO_TRIAGEM,
            dados.historicoMovimentacao ?? []
        );
    }
}
