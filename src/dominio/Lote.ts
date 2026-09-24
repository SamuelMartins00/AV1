import { Equipamento } from "./Equipamento";
import { StatusLote } from "../enums/StatusLote";

export class Lote {
    private id: string;
    private dataEntrada: Date;
    private organizacaoId: string;
    private notaFiscal: string;
    private transportadora: string;
    private equipamentos: Equipamento[];
    private statusProcessamento: StatusLote;
    private observacoes: string;

    constructor(
        id: string,
        dataEntrada: Date,
        organizacaoId: string,
        notaFiscal: string,
        transportadora: string,
        equipamentos: Equipamento[] = [],
        statusProcessamento:
            StatusLote = StatusLote.RECEBIDO,
        observacoes: string = ""
    ) {
        this.id = id;
        this.dataEntrada =
            dataEntrada;
        this.organizacaoId =
            organizacaoId;
        this.notaFiscal =
            notaFiscal;
        this.transportadora =
            transportadora;
        this.equipamentos =
            equipamentos;
        this.statusProcessamento =
            statusProcessamento;
        this.observacoes =
            observacoes;
    }

    public adicionarEquipamento(
        equip: Equipamento
    ): void {
        equip.definirLote(
            this.id,
            this.equipamentos.length + 1
        );

        this.equipamentos.push(equip);
    }

    public removerEquipamento(
        equipId: string
    ): boolean {
        const tamanhoAnterior =
            this.equipamentos.length;

        this.equipamentos =
            this.equipamentos.filter(
                (equipamento) =>
                    equipamento.getId() !==
                    equipId
            );

        return (
            this.equipamentos.length <
            tamanhoAnterior
        );
    }

    public calcularPesoTotal(): number {
        return this.equipamentos.reduce(
            (
                total,
                equipamento
            ) =>
                total +
                equipamento.getPesoQuilogramas(),
            0
        );
    }

    public gerarRelatorioTriagem(): string {
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

    public marcarTriagemConcluida(): void {
        if (
            this.equipamentos.length === 0
        ) {
            throw new Error(
                "Não é possível concluir a triagem de um lote sem equipamentos."
            );
        }

        this.statusProcessamento =
            StatusLote.TRIAGEM_CONCLUIDA;
    }

    public getId(): string {
        return this.id;
    }

    public getDataEntrada(): Date {
        return this.dataEntrada;
    }

    public getOrganizacaoId(): string {
        return this.organizacaoId;
    }

    public getNotaFiscal(): string {
        return this.notaFiscal;
    }

    public getTransportadora(): string {
        return this.transportadora;
    }

    public getEquipamentos():
        Equipamento[] {
        return [...this.equipamentos];
    }

    public getStatusProcessamento():
        StatusLote {
        return this.statusProcessamento;
    }

    public getObservacoes(): string {
        return this.observacoes;
    }
}