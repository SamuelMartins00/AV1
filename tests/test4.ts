import { PapelUsuario } from "../src/enums/PapelUsuario";
import { Credencial } from "../src/autenticacao/Credencial";
import { ServicoAutenticacao } from "../src/autenticacao/ServicoAutenticacao";

function main(): void {
    const credencial = new Credencial(
        "admin",
        "123456",
        PapelUsuario.ADMINISTRADOR
    );

    const autenticacao =
        new ServicoAutenticacao();

    autenticacao.adicionarCredencial(
        credencial
    );

    console.log("=== GREENCODE ===");
    console.log();

    try {
        const sessao =
            autenticacao.login(
                "admin",
                "123456"
            );

        console.log("Login realizado!");
        console.log(
            "Usuário:",
            sessao.getUsuario()
        );
        console.log(
            "Papel:",
            sessao.getPapel()
        );
        console.log(
            "Token:",
            sessao.getToken()
        );

        const tokenValido =
            autenticacao.validarToken(
                sessao.getToken()
            );

        console.log(
            "Token válido:",
            tokenValido
        );

        autenticacao.logout(
            sessao.getToken()
        );

        console.log(
            "Logout realizado!"
        );
    } catch (erro) {
        if (erro instanceof Error) {
            console.error(
                "Erro:",
                erro.message
            );
        }
    }
}

main();