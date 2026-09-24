export class Movimentacao {
    private id: string;
    private equipamentoId: string;
    private dataHora: Date;
    private origem: string;
    private destino: string;
    private responsavel: string;
    private observacao: string;

    constructor(
        id: string,
        equipamentoId: string,
        dataHora: Date,
        origem: string,
        destino: string,
        responsavel: string,
        observacao: string
    ) {
        this.id = id;
        this.equipamentoId =
            equipamentoId;
        this.dataHora = dataHora;
        this.origem = origem;
        this.destino = destino;
        this.responsavel =
            responsavel;
        this.observacao =
            observacao;
    }

    public getId(): string {
        return this.id;
    }

    public getEquipamentoId(): string {
        return this.equipamentoId;
    }

    public getDataHora(): Date {
        return this.dataHora;
    }

    public getOrigem(): string {
        return this.origem;
    }

    public getDestino(): string {
        return this.destino;
    }

    public getResponsavel(): string {
        return this.responsavel;
    }

    public getObservacao(): string {
        return this.observacao;
    }
}