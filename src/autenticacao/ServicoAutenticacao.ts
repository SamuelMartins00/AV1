import { Credencial } from "./Credencial";
import { Sessao } from "./Sessao";
import { PapelUsuario } from "../enums/PapelUsuario";
import { RepositorioArquivo } from "../persistencia/RepositorioArquivo";

export class ServicoAutenticacao {
    private credenciais: Credencial[];
    private sessoesAtivas: Sessao[];
    private repositorio: RepositorioArquivo | null;
    private readonly arquivoCredenciais =
        "credenciais.json.enc";

    constructor(
        credenciais: Credencial[] = [],
        repositorio: RepositorioArquivo | null = null
    ) {
        this.credenciais = credenciais;
        this.sessoesAtivas = [];
        this.repositorio = repositorio;
    }

    login(
        usuario: string,
        senha: string
    ): Sessao {
        const credencial = this.credenciais.find(
            (item) => item.getUsuario() === usuario
        );

        if (!credencial) {
            throw new Error(
                "Usuário ou senha inválidos."
            );
        }

        if (!credencial.verificarSenha(senha)) {
            throw new Error(
                "Usuário ou senha inválidos."
            );
        }

        credencial.atualizarUltimoAcesso();

        const sessao = new Sessao(
            credencial.getUsuario(),
            credencial.getPapel()
        );

        this.sessoesAtivas.push(sessao);

        return sessao;
    }

    logout(token: string): void {
        const quantidadeAntes =
            this.sessoesAtivas.length;

        this.sessoesAtivas =
            this.sessoesAtivas.filter(
                (sessao) =>
                    sessao.getToken() !== token
            );

        if (
            this.sessoesAtivas.length === quantidadeAntes
        ) {
            throw new Error(
                "Sessão não encontrada."
            );
        }
    }

    validarToken(token: string): boolean {
        const sessao = this.sessoesAtivas.find(
            (item) =>
                item.getToken() === token
        );

        if (!sessao) {
            return false;
        }

        if (!sessao.isValida()) {
            this.sessoesAtivas =
                this.sessoesAtivas.filter(
                    (item) =>
                        item.getToken() !== token
                );

            return false;
        }

        sessao.renovar();

        return true;
    }

    alterarSenha(
        usuario: string,
        senhaAntiga: string,
        senhaNova: string
    ): boolean {
        const indice =
            this.credenciais.findIndex(
                (item) =>
                    item.getUsuario() === usuario
            );

        if (indice === -1) {
            return false;
        }

        const credencialAtual =
            this.credenciais[indice];

        if (
            !credencialAtual.verificarSenha(
                senhaAntiga
            )
        ) {
            return false;
        }

        if (senhaNova.trim().length === 0) {
            return false;
        }

        const novaCredencial = new Credencial(
            usuario,
            senhaNova,
            credencialAtual.getPapel()
        );

        this.credenciais[indice] =
            novaCredencial;

        this.persistirCredencial(novaCredencial);

        return true;
    }

    adicionarCredencial(
        credencial: Credencial
    ): void {
        const existe =
            this.credenciais.some(
                (item) =>
                    item.getUsuario() ===
                    credencial.getUsuario()
            );

        if (existe) {
            throw new Error(
                "Usuário já cadastrado."
            );
        }

        this.credenciais.push(credencial);
        this.persistirCredencial(credencial);
    }

    criarUsuario(
        usuario: string,
        senha: string,
        papel: PapelUsuario
    ): Credencial {
        if (!usuario.trim()) {
            throw new Error(
                "O nome de usuário não pode ser vazio."
            );
        }

        if (!senha) {
            throw new Error(
                "A senha não pode ser vazia."
            );
        }

        const credencial = new Credencial(
            usuario.trim(),
            senha,
            papel
        );

        this.adicionarCredencial(credencial);

        return credencial;
    }

    listarUsuarios(): Array<{
        usuario: string;
        papel: PapelUsuario;
        ultimoAcesso: Date;
    }> {
        return this.credenciais.map(
            (credencial) => ({
                usuario: credencial.getUsuario(),
                papel: credencial.getPapel(),
                ultimoAcesso:
                    credencial.getUltimoAcesso()
            })
        );
    }

    private persistirCredencial(
        credencial: Credencial
    ): void {
        if (this.repositorio === null) {
            return;
        }

        this.repositorio.salvarEntidade(
            this.arquivoCredenciais,
            credencial.toJSON()
        );
    }
}