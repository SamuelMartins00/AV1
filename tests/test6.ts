import { CriptografiaArquivo } from "../src/persistencia/CriptografiaArquivo";
import { RepositorioArquivo } from "../src/persistencia/RepositorioArquivo";

function main(): void {
    const criptografia =
        new CriptografiaArquivo();

    const chave =
        criptografia.gerarChave();

    const repositorio =
        new RepositorioArquivo(
            "./data",
            criptografia,
            chave
        );

    const organizacao = {
        id: "ORG001",
        razaoSocial: "Empresa Exemplo LTDA",
        cnpj: "11222333000181",
        ativo: true
    };

    repositorio.salvarEntidade(
        "organizacoes.json.enc",
        organizacao
    );

    console.log(
        "=== TESTE DO REPOSITÓRIO ==="
    );

    console.log();
    console.log(
        "Organização salva:"
    );
    console.log(organizacao);

    console.log();
    console.log(
        "Organização recuperada:"
    );
    console.log(
        repositorio.carregarEntidade(
            "organizacoes.json.enc",
            "ORG001"
        )
    );

    console.log();
    console.log(
        "Todas as organizações:"
    );
    console.log(
        repositorio.listarEntidades(
            "organizacoes.json.enc"
        )
    );
}

main();