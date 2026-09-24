export class Contrato {
    private id: string;
    private organizacaoId: string;
    private dataAssinatura: Date;
    private dataVencimento: Date;
    private clausulas: string[];
    private valorMensal: number;
    private renovacaoAutomatica: boolean;

    constructor(
        id: string,
        organizacaoId: string,
        dataAssinatura: Date,
        dataVencimento: Date,
        clausulas: string[],
        valorMensal: number,
        renovacaoAutomatica: boolean
    ) {
        this.id = id;
        this.organizacaoId = organizacaoId;
        this.dataAssinatura = dataAssinatura;
        this.dataVencimento = dataVencimento;
        this.clausulas = clausulas;
        this.valorMensal = valorMensal;
        this.renovacaoAutomatica = renovacaoAutomatica;
    }

    public estaVigente(): boolean {
        const agora = new Date();

        return (
            agora >= this.dataAssinatura &&
            agora <= this.dataVencimento
        );
    }

    public renovar(
        novoVencimento: Date
    ): void {
        if (
            novoVencimento <=
            this.dataAssinatura
        ) {
            throw new Error(
                "A data de vencimento deve ser posterior à assinatura."
            );
        }

        this.dataVencimento =
            novoVencimento;
    }

    public getId(): string {
        return this.id;
    }

    public getOrganizacaoId(): string {
        return this.organizacaoId;
    }

    public getDataAssinatura(): Date {
        return this.dataAssinatura;
    }

    public getDataVencimento(): Date {
        return this.dataVencimento;
    }

    public getClausulas(): string[] {
        return [...this.clausulas];
    }

    public getValorMensal(): number {
        return this.valorMensal;
    }

    public isRenovacaoAutomatica(): boolean {
        return this.renovacaoAutomatica;
    }
}