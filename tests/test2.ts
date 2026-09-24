import { Organizacao } from "../src/dominio/Organizacao";
import { Contrato } from "../src/dominio/Contrato";
import { Lote } from "../src/dominio/Lote";
import { Equipamento } from "../src/dominio/Equipamento";

import { TipoEquipamento } from "../src/enums/TipoEquipamento";
import { EstadoFisico } from "../src/enums/EstadoFisico";

function main(): void {
    const contrato = new Contrato(
        "CTR001",
        "ORG001",
        new Date("2026-01-01"),
        new Date("2026-12-31"),
        ["Coleta e destinação de resíduos eletrônicos"],
        1500,
        true
    );

    const organizacao = new Organizacao(
        "ORG001",
        "Empresa Exemplo LTDA",
        "12345678000195",
        "123456789",
        "Rua Exemplo, 100",
        "(11) 99999-9999",
        "empresa@exemplo.com",
        new Date(),
        true,
        contrato
    );

    const lote = new Lote(
        "LOT001",
        new Date(),
        organizacao.id,
        "NF123456",
        "TransRapida"
    );

    const equipamento = new Equipamento(
        "EQ001",
        "BC000001",
        TipoEquipamento.NOTEBOOK,
        "Dell",
        "Latitude",
        2023,
        EstadoFisico.BOM_ESTADO,
        1.8,
        lote.id,
        1
    );

    lote.adicionarEquipamento(equipamento);

    console.log("Organização:", organizacao.razaoSocial);
    console.log("Contrato vigente:", contrato.estaVigente());
    console.log("Equipamentos no lote:", lote.equipamentos.length);
    console.log("Peso total:", lote.calcularPesoTotal(), "kg");
}

main();