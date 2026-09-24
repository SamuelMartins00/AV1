import { Contrato } from "./Contrato";

export class Organizacao {
    id: string;
    razaoSocial: string;
    cnpj: string;
    inscricaoEstadual: string;
    enderecoCompleto: string;
    telefone: string;
    email: string;
    dataCadastro: Date;
    ativo: boolean;
    contratoVigente: Contrato | null;

    constructor(
        id: string,
        razaoSocial: string,
        cnpj: string,
        inscricaoEstadual: string,
        enderecoCompleto: string,
        telefone: string,
        email: string,
        dataCadastro: Date = new Date(),
        ativo: boolean = true,
        contratoVigente: Contrato | null = null
    ) {
        this.id = id;
        this.razaoSocial = razaoSocial;
        this.cnpj = cnpj;
        this.inscricaoEstadual = inscricaoEstadual;
        this.enderecoCompleto = enderecoCompleto;
        this.telefone = telefone;
        this.email = email;
        this.dataCadastro = dataCadastro;
        this.ativo = ativo;
        this.contratoVigente = contratoVigente;
    }

    alterarEndereco(novoEndereco: string): void {
        this.enderecoCompleto = novoEndereco;
    }

    desativar(): void {
        this.ativo = false;
    }
}