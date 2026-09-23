import { PapelUsuario } from "../src/enums/PapelUsuario";
import { StatusLote } from "../src/enums/StatusLote";
import { TipoEquipamento } from "../src/enums/TipoEquipamento";
import { EstadoFisico } from "../src/enums/EstadoFisico";
import { StatusRastreamento } from "../src/enums/StatusRastreamento";

function main(): void {
    console.log("=================================");
    console.log("        GREENCODE CLI");
    console.log("=================================");

    console.log("Papel:", PapelUsuario.ADMINISTRADOR);
    console.log("Lote:", StatusLote.RECEBIDO);
    console.log("Equipamento:", TipoEquipamento.NOTEBOOK);
    console.log("Estado:", EstadoFisico.BOM_ESTADO);
    console.log("Rastreamento:", StatusRastreamento.EM_TRIAGEM);
}

main();