import { JournalTransacao } from "../src/auditoria/JournalTransacao";

function main(): void {
    const organizacaoAntes = null;

    const organizacaoDepois = {
        id: "ORG001",
        razaoSocial: "Empresa Exemplo LTDA",
        cnpj: "11222333000181",
        ativo: true
    };

    const transacao =
        new JournalTransacao(
            "TX001",
            new Date(),
            "CRIAR",
            "Organizacao",
            organizacaoAntes,
            organizacaoDepois,
            "admin"
        );

    transacao.registrar();

    console.log(
        "Transação registrada com sucesso."
    );
}

main();