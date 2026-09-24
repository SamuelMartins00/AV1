import { CriptografiaArquivo } from "../src/persistencia/CriptografiaArquivo";

function main(): void {
    const criptografia =
        new CriptografiaArquivo();

    const chave =
        criptografia.gerarChave();

    const mensagem =
        "Greencode - teste de criptografia";

    const criptografado =
        criptografia.cifrar(
            mensagem,
            chave
        );

    const decifrado =
        criptografia.decifrar(
            criptografado,
            chave
        );

    console.log("=== TESTE DE CRIPTOGRAFIA ===");
    console.log();
    console.log("Mensagem original:");
    console.log(mensagem);
    console.log();
    console.log("Conteúdo criptografado:");
    console.log(criptografado);
    console.log();
    console.log("Conteúdo decifrado:");
    console.log(decifrado);
}

main();