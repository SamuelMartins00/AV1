import { CriptografiaArquivo } from "../src/persistencia/CriptografiaArquivo";
import { RepositorioArquivo } from "../src/persistencia/RepositorioArquivo";

import { ServicoRelatorio } from "../src/servicos/ServicoRelatorio";

import { StatusRastreamento } from "../src/enums/StatusRastreamento";

function main(): void {
    const criptografia =
        new CriptografiaArquivo();

    const chave =
        "chave-de-testes";

    const repositorio =
        new RepositorioArquivo(
            "./data",
            criptografia,
            chave
        );

    const servicoRelatorio =
        new ServicoRelatorio(
            repositorio
        );

    console.log(
        servicoRelatorio
            .gerarRelatorioPorStatus(
                StatusRastreamento
                    .AGUARDANDO_TRIAGEM
            )
    );
}

main();