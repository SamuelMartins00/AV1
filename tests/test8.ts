import { CriptografiaArquivo } from "../src/persistencia/CriptografiaArquivo";
import { RepositorioArquivo } from "../src/persistencia/RepositorioArquivo";

import { ValidadorCNPJ } from "../src/validadores/ValidadorCNPJ";
import { ValidadorDataEntrada } from "../src/validadores/ValidadorDataEntrada";

import { JournalTransacao } from "../src/auditoria/JournalTransacao";

import { ServicoOrganizacao } from "../src/servicos/ServicoOrganizacao";
import { ServicoLote } from "../src/servicos/ServicoLote";

function main(): void {
    console.log(
        "================================="
    );

    console.log(
        "        GREENCODE CLI"
    );

    console.log(
        "================================="
    );

    const criptografia =
        new CriptografiaArquivo();

    /*
     * Nesta etapa estamos usando
     * temporariamente uma chave de teste.
     *
     * No fluxo completo ela virá
     * da configuração mestre.
     */
    const chave =
        "chave-de-testes";

    const repositorio =
        new RepositorioArquivo(
            "./data",
            criptografia,
            chave
        );

    const validadorCNPJ =
        new ValidadorCNPJ();

    const validadorDataEntrada =
        new ValidadorDataEntrada();

    const journal =
        new JournalTransacao(
            "BOOT",
            new Date(),
            "INICIALIZACAO",
            "Sistema",
            null,
            null,
            "sistema"
        );

    const servicoOrganizacao =
        new ServicoOrganizacao(
            repositorio,
            validadorCNPJ,
            journal
        );

    const servicoLote =
        new ServicoLote(
            repositorio,
            validadorDataEntrada,
            journal
        );

    console.log();
    console.log(
        "Serviços inicializados."
    );

    console.log(
        servicoOrganizacao !== undefined
    );

    console.log(
        servicoLote !== undefined
    );
}

main();