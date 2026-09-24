import { CriptografiaArquivo } from "../src/persistencia/CriptografiaArquivo";
import { RepositorioArquivo } from "../src/persistencia/RepositorioArquivo";
import { JournalTransacao } from "../src/auditoria/JournalTransacao";

import { ServicoEquipamento } from "../src/servicos/ServicoEquipamento";

import { TipoEquipamento } from "../src/enums/TipoEquipamento";
import { EstadoFisico } from "../src/enums/EstadoFisico";

function main(): void {
    const criptografia =
        new CriptografiaArquivo();

    /*
     * Para este teste estamos usando
     * temporariamente uma chave fixa.
     */
    const chave =
        "chave-de-testes";

    const repositorio =
        new RepositorioArquivo(
            "./data",
            criptografia,
            chave
        );

    const journal =
        new JournalTransacao(
            "BOOT",
            new Date(),
            "TESTE",
            "Sistema",
            null,
            null,
            "sistema"
        );

    const servicoEquipamento =
        new ServicoEquipamento(
            repositorio,
            journal
        );

    const codigo =
        servicoEquipamento
            .gerarCodigoBarras(
                TipoEquipamento.NOTEBOOK,
                15
            );

    console.log(
        "Código de barras:",
        codigo
    );

    console.log();
    console.log(
        "Serviço de equipamento inicializado."
    );
}

main();