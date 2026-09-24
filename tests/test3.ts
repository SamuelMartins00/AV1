import { ValidadorCNPJ } from "../src/validadores/ValidadorCNPJ";
import { ValidadorDataEntrada } from "../src/validadores/ValidadorDataEntrada";

function main(): void {
    const validadorCNPJ = new ValidadorCNPJ();

    const cnpj = "11.222.333/0001-81";

    console.log("CNPJ:", cnpj);
    console.log("CNPJ válido:", validadorCNPJ.validar(cnpj));

    if (!validadorCNPJ.validar(cnpj)) {
        console.log(
            "Erro:",
            validadorCNPJ.obterMensagemErro()
        );
    }

    const validadorData = new ValidadorDataEntrada();

    const data = new Date();

    console.log("Data válida:", validadorData.validar(data));

    if (!validadorData.validar(data)) {
        console.log(
            "Erro:",
            validadorData.obterMensagemErro()
        );
    }
}

main();