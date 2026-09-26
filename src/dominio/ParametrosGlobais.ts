export interface ParametrosGlobaisPersistidos {
    aliquotaImpostos: number;
    coeficienteDepreciacao: number;
    valorBaseDepreciacao: number;
}

export class ParametrosGlobais {
    private aliquotaImpostos!: number;
    private coeficienteDepreciacao!: number;
    private valorBaseDepreciacao!: number;

    constructor(
        aliquotaImpostos: number = 0.18,
        coeficienteDepreciacao: number = 0.2,
        valorBaseDepreciacao: number = 1000
    ) {
        this.definirAliquota(aliquotaImpostos);
        this.definirCoeficienteDepreciacao(
            coeficienteDepreciacao
        );
        this.definirValorBase(
            valorBaseDepreciacao
        );
    }

    public definirAliquota(
        aliquota: number
    ): void {
        if (
            !Number.isFinite(aliquota) ||
            aliquota < 0 ||
            aliquota > 1
        ) {
            throw new Error(
                "A alíquota de impostos deve estar entre 0 e 1."
            );
        }

        this.aliquotaImpostos = aliquota;
    }

    public definirCoeficienteDepreciacao(
        coeficiente: number
    ): void {
        if (
            !Number.isFinite(coeficiente) ||
            coeficiente < 0 ||
            coeficiente > 1
        ) {
            throw new Error(
                "O coeficiente de depreciação deve estar entre 0 e 1."
            );
        }

        this.coeficienteDepreciacao =
            coeficiente;
    }

    public definirValorBase(
        valor: number
    ): void {
        if (
            !Number.isFinite(valor) ||
            valor <= 0
        ) {
            throw new Error(
                "O valor-base de depreciação deve ser maior que zero."
            );
        }

        this.valorBaseDepreciacao = valor;
    }

    public getAliquotaImpostos(): number {
        return this.aliquotaImpostos;
    }

    public getCoeficienteDepreciacao(): number {
        return this.coeficienteDepreciacao;
    }

    public getValorBaseDepreciacao(): number {
        return this.valorBaseDepreciacao;
    }

    public toJSON(): ParametrosGlobaisPersistidos {
        return {
            aliquotaImpostos:
                this.aliquotaImpostos,
            coeficienteDepreciacao:
                this.coeficienteDepreciacao,
            valorBaseDepreciacao:
                this.valorBaseDepreciacao
        };
    }

    public static padrao(): ParametrosGlobais {
        return new ParametrosGlobais();
    }

    public static fromJSON(
        dados?: Partial<ParametrosGlobaisPersistidos>
    ): ParametrosGlobais {
        const padrao =
            ParametrosGlobais.padrao();

        return new ParametrosGlobais(
            dados?.aliquotaImpostos ??
                padrao.getAliquotaImpostos(),
            dados?.coeficienteDepreciacao ??
                padrao.getCoeficienteDepreciacao(),
            dados?.valorBaseDepreciacao ??
                padrao.getValorBaseDepreciacao()
        );
    }
}