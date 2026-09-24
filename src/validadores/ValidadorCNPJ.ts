import { Validador } from "./Validador";

export class ValidadorCNPJ extends Validador {

    validar(cnpj: string): boolean {
        this.mensagemErro = "";

        const cnpjLimpo = cnpj.replace(/\D/g, "");

        if (cnpjLimpo.length !== 14) {
            this.mensagemErro = "O CNPJ deve possuir 14 dígitos.";
            return false;
        }

        if (/^(\d)\1{13}$/.test(cnpjLimpo)) {
            this.mensagemErro = "O CNPJ informado é inválido.";
            return false;
        }

        const primeiroDigito = this.calcularDigito(
            cnpjLimpo.substring(0, 12)
        );

        const segundoDigito = this.calcularDigito(
            cnpjLimpo.substring(0, 12) + primeiroDigito
        );

        const cnpjCalculado =
            cnpjLimpo.substring(0, 12) +
            primeiroDigito +
            segundoDigito;

        if (cnpjCalculado !== cnpjLimpo) {
            this.mensagemErro = "Os dígitos verificadores do CNPJ são inválidos.";
            return false;
        }

        return true;
    }

    private calcularDigito(base: string): number {
        const pesos =
            base.length === 12
                ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
                : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

        let soma = 0;

        for (let i = 0; i < base.length; i++) {
            soma += Number(base[i]) * pesos[i];
        }

        const resto = soma % 11;

        return resto < 2 ? 0 : 11 - resto;
    }
}