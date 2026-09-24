import { Validador } from "./Validador";

export class ValidadorDataEntrada extends Validador {

    validar(data: Date): boolean {
        this.mensagemErro = "";

        if (!(data instanceof Date) || isNaN(data.getTime())) {
            this.mensagemErro = "A data de entrada informada é inválida.";
            return false;
        }

        const agora = new Date();

        if (data > agora) {
            this.mensagemErro =
                "A data de entrada não pode ser futura.";
            return false;
        }

        const limite = new Date(agora);
        limite.setDate(limite.getDate() - 90);

        if (data < limite) {
            this.mensagemErro =
                "A data de entrada não pode ser anterior a 90 dias.";
            return false;
        }

        return true;
    }
}