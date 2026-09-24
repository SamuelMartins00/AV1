import { Contrato } from "./Contrato";

export class Organizacao {
    private id: string;
    private razaoSocial: string;
    private cnpj: string;
    private inscricaoEstadual: string;
    private enderecoCompleto: string;
    private telefone: string;
    private email: string;
    private dataCadastro: Date;
    private ativo: boolean;
    private contratoVigente: Contrato;

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
        contratoVigente: Contrato
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

    public alterarEndereco(novoEndereco: string): void {
        if (!novoEndereco.trim()) {
            throw new Error(
                "O endereço não pode ser vazio."
            );
        }

        this.enderecoCompleto = novoEndereco;
    }

    public desativar(): void {
        this.ativo = false;
    }

    public getId(): string {
        return this.id;
    }

    public getRazaoSocial(): string {
        return this.razaoSocial;
    }

    public getCnpj(): string {
        return this.cnpj;
    }

    public getInscricaoEstadual(): string {
        return this.inscricaoEstadual;
    }

    public getEnderecoCompleto(): string {
        return this.enderecoCompleto;
    }

    public getTelefone(): string {
        return this.telefone;
    }

    public getEmail(): string {
        return this.email;
    }

    public getDataCadastro(): Date {
        return this.dataCadastro;
    }

    public isAtiva(): boolean {
        return this.ativo;
    }

    public getContratoVigente(): Contrato {
        return this.contratoVigente;
    }
}