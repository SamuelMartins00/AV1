import { Equipamento } from "./Equipamento";
import { StatusLote } from "../enums/StatusLote";

export class Lote {
    id: string;
    dataEntrada: Date;
    organizacaoId: string;
    notaFiscal: string;
    transportadora: string;
    equipamentos: Equipamento[];
    statusProcessamento: StatusLote;
    observacoes: string;

    constructor(
        id: string,
        dataEntrada: Date,
        organizacaoId: string,
        notaFiscal: string,
        transportadora: string,
        equipamentos: Equipamento[] = [],
        statusProcessamento: StatusLote = StatusLote.RECEBIDO,
        observacoes: string = ""
    ) {
        this.id = id;
        this.dataEntrada = dataEntrada;
        this.organizacaoId = organizacaoId;
        this.notaFiscal = notaFiscal;
        this.transportadora = transportadora;
        this.equipamentos = equipamentos;
        this.statusProcessamento = statusProcessamento;
        this.observacoes = observacoes;
    }

    adicionarEquipamento(equip: Equipamento): void {
        equip.loteId = this.id;
        equip.posicaoNoLote = this.equipamentos.length + 1;

        this.equipamentos.push(equip);
    }

    removerEquipamento(equipId: string): boolean {
        const tamanhoAnterior = this.equipamentos.length;

        this.equipamentos = this.equipamentos.filter(
            (equipamento) => equipamento.id !== equipId
        );

        return this.equipamentos.length < tamanhoAnterior;
    }

    calcularPesoTotal(): number {
        return this.equipamentos.reduce(
            (total, equipamento) => total + equipamento.pesoQuilogramas,
            0
        );
    }

    gerarRelatorioTriagem(): string {
        return [
            `Lote: ${this.id}`,
            `Organização: ${this.organizacaoId}`,
            `Data de entrada: ${this.dataEntrada.toISOString()}`,
            `Nota fiscal: ${this.notaFiscal}`,
            `Transportadora: ${this.transportadora}`,
            `Quantidade de equipamentos: ${this.equipamentos.length}`,
            `Peso total: ${this.calcularPesoTotal()} kg`,
            `Status: ${this.statusProcessamento}`,
            `Observações: ${this.observacoes}`
        ].join("\n");
    }
}