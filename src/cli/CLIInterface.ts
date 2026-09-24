import * as readline from "readline";

import {
    existsSync,
    appendFileSync,
    mkdirSync,
    readFileSync
} from "fs";

import { dirname } from "path";
import { randomUUID } from "crypto";

import {
    ServicoAutenticacao
} from "../autenticacao/ServicoAutenticacao";

import {
    Sessao
} from "../autenticacao/Sessao";

import {
    ServicoOrganizacao
} from "../servicos/ServicoOrganizacao";

import {
    ServicoLote
} from "../servicos/ServicoLote";

import {
    ServicoEquipamento
} from "../servicos/ServicoEquipamento";

import {
    ServicoRelatorio
} from "../servicos/ServicoRelatorio";

import {
    PapelUsuario
} from "../enums/PapelUsuario";

import {
    TipoEquipamento
} from "../enums/TipoEquipamento";

import {
    EstadoFisico
} from "../enums/EstadoFisico";

import {
    StatusRastreamento
} from "../enums/StatusRastreamento";

import {
    Equipamento
} from "../dominio/Equipamento";

type InterfaceComHistorico =
    readline.Interface & {
        history: string[];
    };

interface ArgumentosComando {
    opcoes: Record<string, string>;
    posicionais: string[];
}

export class CLIInterface {
    private autenticacao: ServicoAutenticacao;
    private organizacao: ServicoOrganizacao;
    private lote: ServicoLote;
    private equipamento: ServicoEquipamento;
    private relatorio: ServicoRelatorio;

    private sessaoAtual: Sessao | null;

    private terminal:
        InterfaceComHistorico | null;

    private readonly arquivoHistorico =
        "./data/.greencode_history";

    constructor(
        autenticacao: ServicoAutenticacao,
        organizacao: ServicoOrganizacao,
        lote: ServicoLote,
        equipamento: ServicoEquipamento,
        relatorio: ServicoRelatorio
    ) {
        this.autenticacao = autenticacao;
        this.organizacao = organizacao;
        this.lote = lote;
        this.equipamento = equipamento;
        this.relatorio = relatorio;

        this.sessaoAtual = null;
        this.terminal = null;
    }

    public async iniciarLoop(): Promise<void> {
        this.criarTerminal();

        this.exibirCabecalho();

        while (true) {
            if (this.sessaoAtual === null) {
                const loginRealizado =
                    await this.realizarLogin();

                if (!loginRealizado) {
                    break;
                }

                this.exibirMenuPorPapel(
                    this.sessaoAtual!.getPapel()
                );

                continue;
            }

            const sessao =
                this.sessaoAtual;

            const token =
                sessao.getToken();

            if (
                !this.autenticacao.validarToken(
                    token
                )
            ) {
                this.erro(
                    "Sua sessão expirou por inatividade."
                );

                this.sessaoAtual = null;

                continue;
            }

            const entrada =
                await this.perguntar(
                    "> ",
                    true
                );

            const comando =
                entrada.trim();

            if (comando === "") {
                continue;
            }

            if (
                comando.toLowerCase() ===
                "sair"
            ) {
                break;
            }

            if (
                comando.toLowerCase() ===
                "logout"
            ) {
                this.fazerLogout();
                continue;
            }

            try {
                this.processarComando(
                    comando
                );
            } catch (erro: unknown) {
                this.erro(
                    erro instanceof Error
                        ? erro.message
                        : "Erro desconhecido."
                );
            }
        }

        this.fecharTerminal();

        console.log();
        console.log(
            "GREENCODE encerrado."
        );
    }

    public processarComando(
        entrada: string
    ): void {
        if (
            this.sessaoAtual === null
        ) {
            throw new Error(
                "Nenhum usuário autenticado."
            );
        }

        if (
            !this.sessaoAtual.isValida()
        ) {
            throw new Error(
                "A sessão expirou."
            );
        }

        const tokens =
            this.tokenizar(entrada);

        if (
            tokens.length === 0
        ) {
            return;
        }

        const modulo =
            tokens[0].toLowerCase();

        const acao =
            tokens.length > 1
                ? tokens[1].toLowerCase()
                : "";

        const argumentos =
            this.parsearOpcoes(
                tokens.slice(2)
            );

        if (
            modulo === "ajuda" ||
            modulo === "help"
        ) {
            this.exibirMenuPorPapel(
                this.sessaoAtual.getPapel()
            );

            return;
        }

        if (
            !this.temPermissao(
                modulo,
                acao
            )
        ) {
            throw new Error(
                "Você não possui permissão para executar este comando."
            );
        }

        switch (modulo) {
            case "org":
                this.processarOrganizacao(
                    acao,
                    argumentos
                );
                break;

            case "lote":
                this.processarLote(
                    acao,
                    argumentos
                );
                break;

            case "equip":
                this.processarEquipamento(
                    acao,
                    argumentos
                );
                break;

            case "relatorio":
                this.processarRelatorio(
                    acao,
                    argumentos
                );
                break;

            default:
                throw new Error(
                    `Comando desconhecido: ${modulo}`
                );
        }
    }

    public exibirMenuPorPapel(
        papel: PapelUsuario
    ): void {
        console.log();
        console.log(
            "---------------------------------"
        );

        console.log(
            `Usuário: ${this.sessaoAtual?.getUsuario() ?? ""
            }`
        );

        console.log(
            `Papel: ${papel}`
        );

        console.log(
            "---------------------------------"
        );

        console.log(
            "Comandos disponíveis:"
        );

        console.log(
            "  ajuda"
        );

        console.log(
            "  logout"
        );

        console.log(
            "  sair"
        );

        switch (papel) {
            case PapelUsuario.ADMINISTRADOR:
                this.menuAdministrador();
                break;

            case PapelUsuario.OPERADOR_CADASTRO:
                this.menuOperadorCadastro();
                break;

            case PapelUsuario.GESTOR_ALMOXARIFADO:
                this.menuGestorAlmoxarifado();
                break;

            case PapelUsuario.AUDITOR:
                this.menuAuditor();
                break;
        }

        console.log(
            "---------------------------------"
        );

        console.log();
    }

    private menuAdministrador(): void {
        console.log(
            "  org criar ..."
        );

        console.log(
            "  org buscar ID"
        );

        console.log(
            "  org listar"
        );

        console.log(
            "  org renovar ID --vencimento DATA"
        );

        console.log(
            "  lote criar ..."
        );

        console.log(
            "  lote adicionar-equipamento ..."
        );

        console.log(
            "  lote triagem --lote ID"
        );

        console.log(
            "  equip rastrear ID"
        );

        console.log(
            "  equip estado ID --novo ESTADO --justificativa \"...\""
        );

        console.log(
            "  equip codigo --tipo TIPO --seq NUMERO"
        );

        console.log(
            "  relatorio organizacao ID --inicio DATA --fim DATA"
        );

        console.log(
            "  relatorio status STATUS"
        );

        console.log(
            "  relatorio financeiro --inicio DATA --fim DATA"
        );
    }

    private menuOperadorCadastro(): void {
        console.log(
            "  org criar ..."
        );

        console.log(
            "  org buscar ID"
        );

        console.log(
            "  org listar"
        );

        console.log(
            "  org renovar ID --vencimento DATA"
        );
    }

    private menuGestorAlmoxarifado(): void {
        console.log(
            "  lote criar ..."
        );

        console.log(
            "  lote adicionar-equipamento ..."
        );

        console.log(
            "  lote triagem --lote ID"
        );

        console.log(
            "  equip rastrear ID"
        );

        console.log(
            "  equip estado ID --novo ESTADO --justificativa \"...\""
        );

        console.log(
            "  equip codigo --tipo TIPO --seq NUMERO"
        );
    }

    private menuAuditor(): void {
        console.log(
            "  equip rastrear ID"
        );

        console.log(
            "  relatorio organizacao ID --inicio DATA --fim DATA"
        );

        console.log(
            "  relatorio status STATUS"
        );

        console.log(
            "  relatorio financeiro --inicio DATA --fim DATA"
        );
    }

    private temPermissao(
        modulo: string,
        acao: string
    ): boolean {
        if (
            this.sessaoAtual === null
        ) {
            return false;
        }

        const papel =
            this.sessaoAtual.getPapel();

        switch (papel) {
            case PapelUsuario.ADMINISTRADOR:
                return true;

            case PapelUsuario.OPERADOR_CADASTRO:
                return modulo === "org";

            case PapelUsuario.GESTOR_ALMOXARIFADO:
                return (
                    modulo === "lote" ||
                    modulo === "equip"
                );

            case PapelUsuario.AUDITOR:
                return (
                    modulo === "relatorio" ||
                    (
                        modulo === "equip" &&
                        acao === "rastrear"
                    )
                );

            default:
                return false;
        }
    }

    private processarOrganizacao(
        acao: string,
        argumentos: ArgumentosComando
    ): void {
        switch (acao) {
            case "criar": {
                this.exigirOpcoes(
                    argumentos,
                    [
                        "razao",
                        "cnpj",
                        "ie",
                        "endereco",
                        "telefone",
                        "email",
                        "vencimento",
                        "valor"
                    ]
                );

                const organizacao =
                    this.organizacao
                        .cadastrarOrganizacao({
                            id:
                                argumentos.opcoes.id,

                            razaoSocial:
                                argumentos.opcoes.razao,

                            cnpj:
                                argumentos.opcoes.cnpj,

                            inscricaoEstadual:
                                argumentos.opcoes.ie,

                            enderecoCompleto:
                                argumentos.opcoes.endereco,

                            telefone:
                                argumentos.opcoes.telefone,

                            email:
                                argumentos.opcoes.email,

                            contrato: {
                                dataVencimento:
                                    argumentos.opcoes.vencimento,

                                valorMensal:
                                    Number(
                                        argumentos.opcoes.valor
                                    ),

                                renovacaoAutomatica:
                                    argumentos.opcoes
                                        .renovacao ===
                                    "true"
                            }
                        });

                this.sucesso(
                    `Organização criada com ID ${organizacao.getId()
                    }.`
                );

                break;
            }

            case "buscar": {
                const id =
                    this.obterPosicional(
                        argumentos,
                        0,
                        "Informe o ID da organização."
                    );

                const organizacao =
                    this.organizacao
                        .buscarOrganizacao(id);

                const contrato =
                    organizacao
                        .getContratoVigente();

                console.log();

                console.log(
                    "=========== ORGANIZAÇÃO ==========="
                );

                console.log(
                    `ID: ${organizacao.getId()}`
                );

                console.log(
                    `Razão social: ${organizacao.getRazaoSocial()}`
                );

                console.log(
                    `CNPJ: ${organizacao.getCnpj()}`
                );

                console.log(
                    `Inscrição estadual: ${organizacao.getInscricaoEstadual()}`
                );

                console.log(
                    `Endereço: ${organizacao.getEnderecoCompleto()}`
                );

                console.log(
                    `Telefone: ${organizacao.getTelefone()}`
                );

                console.log(
                    `E-mail: ${organizacao.getEmail()}`
                );

                console.log(
                    `Ativa: ${organizacao.isAtiva()}`
                );

                console.log(
                    `Contrato vigente: ${contrato.estaVigente()}`
                );

                console.log(
                    "===================================="
                );

                break;
            }

            case "listar": {
                const organizacoes =
                    this.organizacao
                        .listarOrganizacoesAtivas();

                if (
                    organizacoes.length === 0
                ) {
                    this.info(
                        "Nenhuma organização ativa encontrada."
                    );

                    return;
                }

                console.log();

                for (
                    const organizacao
                    of organizacoes
                ) {
                    console.log(
                        `${organizacao.getId()} | ` +
                        `${organizacao.getRazaoSocial()} | ` +
                        `${organizacao.getCnpj()}`
                    );
                }

                break;
            }

            case "renovar": {
                const id =
                    this.obterPosicional(
                        argumentos,
                        0,
                        "Informe o ID da organização."
                    );

                this.exigirOpcoes(
                    argumentos,
                    ["vencimento"]
                );

                const vencimento =
                    this.converterData(
                        argumentos.opcoes.vencimento
                    );

                this.organizacao
                    .renovarContrato(
                        id,
                        vencimento
                    );

                this.sucesso(
                    "Contrato renovado com sucesso."
                );

                break;
            }

            default:
                throw new Error(
                    `Ação de organização desconhecida: ${acao}`
                );
        }
    }

    private processarLote(
        acao: string,
        argumentos: ArgumentosComando
    ): void {
        switch (acao) {
            case "criar": {
                this.exigirOpcoes(
                    argumentos,
                    [
                        "org",
                        "nf",
                        "transp"
                    ]
                );

                const dataEntrada =
                    argumentos.opcoes.data
                        ? this.converterData(
                            argumentos.opcoes.data
                        )
                        : new Date();

                const lote =
                    this.lote.criarLote({
                        id:
                            argumentos.opcoes.id,

                        dataEntrada,

                        organizacaoId:
                            argumentos.opcoes.org,

                        notaFiscal:
                            argumentos.opcoes.nf,

                        transportadora:
                            argumentos.opcoes.transp,

                        observacoes:
                            argumentos.opcoes.obs ??
                            ""
                    });

                this.sucesso(
                    `Lote criado com ID ${lote.getId()}.`
                );

                break;
            }

            case "adicionar-equipamento": {
                this.exigirOpcoes(
                    argumentos,
                    [
                        "lote",
                        "tipo",
                        "marca",
                        "modelo",
                        "ano",
                        "estado",
                        "peso"
                    ]
                );

                const tipo =
                    this.converterEnum(
                        TipoEquipamento,
                        argumentos.opcoes.tipo,
                        "tipo de equipamento"
                    );

                const estado =
                    this.converterEnum(
                        EstadoFisico,
                        argumentos.opcoes.estado,
                        "estado físico"
                    );

                const loteId =
                    argumentos.opcoes.lote;

                const equipamentoId =
                    argumentos.opcoes.id ??
                    randomUUID();

                const codigo =
                    argumentos.opcoes.codigo ??
                    `${tipo}-${Date.now()}`;

                const ano =
                    Number(
                        argumentos.opcoes.ano
                    );

                const peso =
                    Number(
                        argumentos.opcoes.peso
                    );

                this.validarNumero(
                    ano,
                    "ano"
                );

                this.validarNumero(
                    peso,
                    "peso"
                );

                const equipamento =
                    new Equipamento(
                        equipamentoId,
                        codigo,
                        tipo,
                        argumentos.opcoes.marca,
                        argumentos.opcoes.modelo,
                        ano,
                        estado,
                        peso,
                        loteId,
                        1
                    );

                this.lote
                    .adicionarEquipamentoLote(
                        loteId,
                        equipamento
                    );

                this.sucesso(
                    `Equipamento ${equipamento.getId()} adicionado ao lote ${loteId}.`
                );

                break;
            }

            case "triagem": {
                this.exigirOpcoes(
                    argumentos,
                    ["lote"]
                );

                this.lote
                    .processarTriagem(
                        argumentos.opcoes.lote
                    );

                this.sucesso(
                    "Triagem concluída com sucesso."
                );

                break;
            }

            default:
                throw new Error(
                    `Ação de lote desconhecida: ${acao}`
                );
        }
    }

    private processarEquipamento(
        acao: string,
        argumentos: ArgumentosComando
    ): void {
        switch (acao) {
            case "rastrear": {
                const id =
                    this.obterPosicional(
                        argumentos,
                        0,
                        "Informe o ID do equipamento."
                    );

                const historico =
                    this.equipamento
                        .rastrearEquipamento(id);

                const equipamento =
                    historico.equipamento;

                console.log();

                console.log(
                    "========== RASTREABILIDADE =========="
                );

                console.log(
                    `ID: ${equipamento.getId()}`
                );

                console.log(
                    `Código: ${equipamento.getCodigoBarrasInterno()}`
                );

                console.log(
                    `Tipo: ${equipamento.getTipo()}`
                );

                console.log(
                    `Marca: ${equipamento.getMarca()}`
                );

                console.log(
                    `Modelo: ${equipamento.getModelo()}`
                );

                console.log(
                    `Ano: ${equipamento.getAnoFabricacao()}`
                );

                console.log(
                    `Estado físico: ${equipamento.getEstadoFisico()}`
                );

                console.log(
                    `Status: ${equipamento.getStatusRastreamento()}`
                );

                console.log(
                    `Lote: ${equipamento.getLoteId()}`
                );

                console.log();

                console.log(
                    "Movimentações:"
                );

                if (
                    historico.movimentacoes
                        .length === 0
                ) {
                    console.log(
                        "  Nenhuma movimentação registrada."
                    );
                } else {
                    for (
                        const movimentacao
                        of historico.movimentacoes
                    ) {
                        console.log(
                            `  ${movimentacao
                                .getDataHora()
                                .toLocaleString("pt-BR")} | ` +
                            `${movimentacao.getOrigem()} -> ` +
                            `${movimentacao.getDestino()} | ` +
                            `Responsável: ${movimentacao.getResponsavel()}`
                        );
                    }
                }

                console.log(
                    "======================================"
                );

                break;
            }

            case "estado": {
                const id =
                    this.obterPosicional(
                        argumentos,
                        0,
                        "Informe o ID do equipamento."
                    );

                this.exigirOpcoes(
                    argumentos,
                    ["novo"]
                );

                const novoEstado =
                    this.converterEnum(
                        EstadoFisico,
                        argumentos.opcoes.novo,
                        "novo estado físico"
                    );

                this.equipamento
                    .atualizarEstadoFisico(
                        id,
                        novoEstado,
                        argumentos.opcoes.justificativa ??
                        ""
                    );

                this.sucesso(
                    "Estado físico atualizado com sucesso."
                );

                break;
            }

            case "codigo": {
                this.exigirOpcoes(
                    argumentos,
                    [
                        "tipo",
                        "seq"
                    ]
                );

                const tipo =
                    this.converterEnum(
                        TipoEquipamento,
                        argumentos.opcoes.tipo,
                        "tipo de equipamento"
                    );

                const sequencia =
                    Number(
                        argumentos.opcoes.seq
                    );

                this.validarNumero(
                    sequencia,
                    "sequência"
                );

                const codigo =
                    this.equipamento
                        .gerarCodigoBarras(
                            tipo,
                            sequencia
                        );

                this.sucesso(
                    `Código gerado: ${codigo}`
                );

                break;
            }

            default:
                throw new Error(
                    `Ação de equipamento desconhecida: ${acao}`
                );
        }
    }

    private processarRelatorio(
        acao: string,
        argumentos: ArgumentosComando
    ): void {
        switch (acao) {
            case "organizacao": {
                const id =
                    this.obterPosicional(
                        argumentos,
                        0,
                        "Informe o ID da organização."
                    );

                this.exigirOpcoes(
                    argumentos,
                    [
                        "inicio",
                        "fim"
                    ]
                );

                const relatorio =
                    this.relatorio
                        .gerarRelatorioPorOrganizacao(
                            id,
                            {
                                inicio:
                                    this.converterData(
                                        argumentos
                                            .opcoes
                                            .inicio
                                    ),

                                fim:
                                    this.converterData(
                                        argumentos
                                            .opcoes
                                            .fim
                                    )
                            }
                        );

                console.log();
                console.log(
                    relatorio
                );

                break;
            }

            case "status": {
                const status =
                    this.obterPosicional(
                        argumentos,
                        0,
                        "Informe o status de rastreamento."
                    );

                const statusEnum =
                    this.converterEnum(
                        StatusRastreamento,
                        status,
                        "status de rastreamento"
                    );

                console.log();

                console.log(
                    this.relatorio
                        .gerarRelatorioPorStatus(
                            statusEnum
                        )
                );

                break;
            }

            case "financeiro": {
                this.exigirOpcoes(
                    argumentos,
                    [
                        "inicio",
                        "fim"
                    ]
                );

                console.log();

                console.log(
                    this.relatorio
                        .gerarRelatorioFinanceiro(
                            {
                                inicio:
                                    this.converterData(
                                        argumentos
                                            .opcoes
                                            .inicio
                                    ),

                                fim:
                                    this.converterData(
                                        argumentos
                                            .opcoes
                                            .fim
                                    )
                            }
                        )
                );

                break;
            }

            default:
                throw new Error(
                    `Ação de relatório desconhecida: ${acao}`
                );
        }
    }

    private async realizarLogin():
        Promise<boolean> {
        while (true) {
            const usuario =
                await this.perguntar(
                    "Usuário: ",
                    false
                );

            if (
                usuario
                    .trim()
                    .toLowerCase() ===
                "sair"
            ) {
                return false;
            }

            const senha =
                await this.perguntarSenha();

            try {
                const sessao =
                    this.autenticacao.login(
                        usuario.trim(),
                        senha
                    );

                this.sessaoAtual =
                    sessao;

                this.sucesso(
                    `Login realizado com sucesso. Bem-vindo, ${sessao.getUsuario()}.`
                );

                return true;
            } catch (erro: unknown) {
                this.erro(
                    erro instanceof Error
                        ? erro.message
                        : "Usuário ou senha inválidos."
                );

                console.log();
            }
        }
    }

    private async perguntarSenha(): Promise<string> {
        return new Promise<string>((resolve) => {
            /*
             * Fecha temporariamente o readline principal
             * para ele não disputar a entrada da senha.
             */
            this.fecharTerminal();

            const stdin = process.stdin;
            const stdout = process.stdout;

            let senha = "";
            let finalizado = false;

            const finalizar = (): void => {
                if (finalizado) {
                    return;
                }

                finalizado = true;

                stdin.setRawMode?.(false);
                stdin.removeListener(
                    "data",
                    onData
                );

                stdout.write("\n");

                /*
                 * Recria o terminal principal depois
                 * que a senha foi digitada.
                 */
                this.criarTerminal();
            };

            const onData = (dados: Buffer): void => {
                const tecla =
                    dados.toString("utf8");

                /*
                 * Ctrl + C
                 */
                if (tecla === "\u0003") {
                    finalizar();

                    process.exit(130);
                }

                /*
                 * Enter
                 */
                if (
                    tecla === "\r" ||
                    tecla === "\n"
                ) {
                    const senhaInformada =
                        senha;

                    finalizar();

                    resolve(
                        senhaInformada
                    );

                    return;
                }

                /*
                 * Backspace
                 */
                if (
                    tecla === "\b" ||
                    tecla === "\x7f"
                ) {
                    if (senha.length > 0) {
                        senha =
                            senha.slice(
                                0,
                                -1
                            );

                        stdout.write(
                            "\b \b"
                        );
                    }

                    return;
                }

                /*
                 * Ignora teclas de controle,
                 * como setas e outras sequências ANSI.
                 */
                if (
                    tecla.startsWith("\u001b")
                ) {
                    return;
                }

                /*
                 * Aceita caracteres normais.
                 * Isso também permite colar uma senha.
                 */
                for (
                    const caractere
                    of tecla
                ) {
                    if (
                        caractere >= " "
                    ) {
                        senha += caractere;

                        stdout.write("*");
                    }
                }
            };

            stdout.write("Senha: ");

            stdin.setRawMode?.(true);
            stdin.resume();

            stdin.on(
                "data",
                onData
            );
        });
    }

    private fazerLogout(): void {
        if (
            this.sessaoAtual === null
        ) {
            return;
        }

        try {
            this.autenticacao.logout(
                this.sessaoAtual.getToken()
            );
        } finally {
            this.sessaoAtual = null;
        }

        this.info(
            "Logout realizado."
        );
    }

    private criarTerminal(): void {
        const diretorio =
            dirname(
                this.arquivoHistorico
            );

        if (
            !existsSync(diretorio)
        ) {
            mkdirSync(
                diretorio,
                {
                    recursive: true
                }
            );
        }

        this.terminal =
            readline.createInterface({
                input: process.stdin,
                output: process.stdout,
                terminal: true,
                historySize: 100,

                completer: (
                    linha,
                    callback
                ) => {
                    const comandos = [
                        "ajuda",
                        "logout",
                        "sair",

                        "org criar",
                        "org buscar",
                        "org listar",
                        "org renovar",

                        "lote criar",
                        "lote adicionar-equipamento",
                        "lote triagem",

                        "equip rastrear",
                        "equip estado",
                        "equip codigo",

                        "relatorio organizacao",
                        "relatorio status",
                        "relatorio financeiro"
                    ];

                    const encontrados =
                        comandos.filter(
                            (comando) =>
                                comando
                                    .toLowerCase()
                                    .startsWith(
                                        linha
                                            .toLowerCase()
                                    )
                        );

                    callback(
                        null,
                        [
                            encontrados,
                            linha
                        ]
                    );
                }
            }) as InterfaceComHistorico;

        this.carregarHistorico();
    }

    private carregarHistorico(): void {
        if (
            this.terminal === null
        ) {
            return;
        }

        if (
            !existsSync(
                this.arquivoHistorico
            )
        ) {
            return;
        }

        try {
            const conteudo =
                readFileSync(
                    this.arquivoHistorico,
                    "utf8"
                );

            const historico =
                conteudo
                    .split(/\r?\n/)
                    .filter(
                        (
                            linha
                        ) =>
                            linha.trim() !== ""
                    )
                    .slice(-100)
                    .reverse();

            this.terminal.history =
                historico;
        } catch {
        }
    }

    private registrarHistorico(
        entrada: string
    ): void {
        if (
            !entrada.trim()
        ) {
            return;
        }

        try {
            appendFileSync(
                this.arquivoHistorico,
                entrada.trim() +
                "\n",
                "utf8"
            );
        } catch {
        }
    }

    private async perguntar(
        pergunta: string,
        salvarHistorico: boolean
    ): Promise<string> {
        if (
            this.terminal === null
        ) {
            throw new Error(
                "Terminal não inicializado."
            );
        }

        const resposta =
            await new Promise<string>(
                (resolve) => {
                    this.terminal?.question(
                        pergunta,
                        resolve
                    );
                }
            );

        if (
            salvarHistorico
        ) {
            this.registrarHistorico(
                resposta
            );
        }

        return resposta;
    }

    private fecharTerminal(): void {
        if (
            this.terminal !== null
        ) {
            this.terminal.close();
            this.terminal = null;
        }
    }

    private tokenizar(
        entrada: string
    ): string[] {
        const resultado: string[] = [];

        const regex =
            /[^\s"]+|"[^"]*"/g;

        const encontrados =
            entrada.match(
                regex
            );

        if (
            encontrados === null
        ) {
            return resultado;
        }

        for (
            const token
            of encontrados
        ) {
            if (
                token.startsWith('"') &&
                token.endsWith('"')
            ) {
                resultado.push(
                    token.slice(
                        1,
                        -1
                    )
                );
            } else {
                resultado.push(
                    token
                );
            }
        }

        return resultado;
    }

    private parsearOpcoes(
        tokens: string[]
    ): ArgumentosComando {
        const opcoes:
            Record<string, string> = {};

        const posicionais: string[] = [];

        let i = 0;

        while (
            i < tokens.length
        ) {
            const token =
                tokens[i];

            if (
                token.startsWith("--")
            ) {
                const semPrefixo =
                    token.substring(2);

                const indiceIgual =
                    semPrefixo.indexOf("=");

                if (
                    indiceIgual >= 0
                ) {
                    const chave =
                        semPrefixo
                            .substring(
                                0,
                                indiceIgual
                            )
                            .toLowerCase();

                    const valor =
                        semPrefixo.substring(
                            indiceIgual + 1
                        );

                    opcoes[chave] =
                        valor;
                } else {
                    const chave =
                        semPrefixo
                            .toLowerCase();

                    const proximo =
                        tokens[i + 1];

                    if (
                        proximo !== undefined &&
                        !proximo.startsWith("--")
                    ) {
                        opcoes[chave] =
                            proximo;

                        i += 2;

                        continue;
                    }

                    opcoes[chave] =
                        "true";
                }

                i++;

                continue;
            }

            posicionais.push(
                token
            );

            i++;
        }

        return {
            opcoes,
            posicionais
        };
    }

    private exigirOpcoes(
        argumentos: ArgumentosComando,
        nomes: string[]
    ): void {
        for (
            const nome
            of nomes
        ) {
            const valor =
                argumentos.opcoes[nome];

            if (
                valor === undefined ||
                valor.trim() === ""
            ) {
                throw new Error(
                    `Parâmetro obrigatório ausente: --${nome}`
                );
            }
        }
    }

    private obterPosicional(
        argumentos: ArgumentosComando,
        indice: number,
        mensagemErro: string
    ): string {
        const valor =
            argumentos.posicionais[indice];

        if (
            valor === undefined ||
            valor.trim() === ""
        ) {
            throw new Error(
                mensagemErro
            );
        }

        return valor;
    }

    private converterData(valor: string): Date {
        const texto = valor.trim();

        const correspondencia =
            /^(\d{4})-(\d{2})-(\d{2})$/.exec(
                texto
            );

        if (correspondencia !== null) {
            const ano =
                Number(correspondencia[1]);

            const mes =
                Number(correspondencia[2]);

            const dia =
                Number(correspondencia[3]);

            const data =
                new Date(
                    ano,
                    mes - 1,
                    dia
                );

            if (
                data.getFullYear() !== ano ||
                data.getMonth() !== mes - 1 ||
                data.getDate() !== dia
            ) {
                throw new Error(
                    `Data inválida: ${valor}`
                );
            }

            return data;
        }

        const data =
            new Date(texto);

        if (
            isNaN(
                data.getTime()
            )
        ) {
            throw new Error(
                `Data inválida: ${valor}`
            );
        }

        return data;
    }

    private converterEnum<
        T extends Record<string, string>
    >(
        enumeration: T,
        valor: string,
        descricao: string
    ): T[keyof T] {
        const valores =
            Object.values(
                enumeration
            );

        const encontrado =
            valores.find(
                (item) =>
                    item.toLowerCase() ===
                    valor.toLowerCase()
            );

        if (
            encontrado === undefined
        ) {
            throw new Error(
                `${descricao} inválido: ${valor}.`
            );
        }

        return encontrado as T[keyof T];
    }

    private validarNumero(
        valor: number,
        campo: string
    ): void {
        if (
            !Number.isFinite(valor)
        ) {
            throw new Error(
                `O ${campo} informado é inválido.`
            );
        }
    }

    private exibirCabecalho(): void {
        console.log();
        console.log(
            "================================="
        );
        console.log(
            "          GREENCODE CLI"
        );
        console.log(
            "================================="
        );
        console.log(
            "Sistema de logística reversa."
        );
        console.log();
    }

    private sucesso(
        mensagem: string
    ): void {
        console.log(
            `[SUCESSO] ${mensagem}`
        );
    }

    private erro(
        mensagem: string
    ): void {
        console.error(
            `[ERRO] ${mensagem}`
        );
    }

    private info(
        mensagem: string
    ): void {
        console.log(
            `[INFO] ${mensagem}`
        );
    }
}