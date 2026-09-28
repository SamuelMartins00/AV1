# AV1 - Documentação

## 1. Sobre o projeto
O **greencode** é uma CLI em Node.js + TypeScript para o fluxo de logística reversa de resíduos eletrônicos. A proposta da AV1 combina domínio orientado a objetos, validações de negócio, autenticação, persistência local, criptografia e auditoria.

## 2. Requisitos
- Node.js 20 ou superior
- npm
- Windows 10+, Ubuntu 24.04+ ou derivadas

## 3. Instalação
```bash
npm install
```

## 4. Execução em desenvolvimento
```bash
npm run dev
```

## 5. Build e execução compilada
```bash
npm run build
node dist/index.js
```

## 6. Verificação de TypeScript e testes
```bash
npm run check
npm test
```

## 7. Fluxo recomendado para demonstração
1. Fazer login com o usuário provisionado.
2. Criar ou consultar uma organização.
3. Criar um lote.
4. Adicionar um equipamento.
5. Consultar `equip rastrear ID`.
6. Processar `lote triagem --lote ID`.
7. Registrar `equip movimentar ID --destino "Desmontagem" --observacao "..."`.
8. Consultar novamente `equip rastrear ID`.
9. Testar a regra de justificativa em `equip estado`.
10. Gerar os três tipos de relatório.
11. Encerrar com `logout` ou `sair`.

## 8. Comandos principais
```text
ajuda
logout
sair

usuario criar ...
usuario listar
usuario senha

config mostrar
config aliquota ...
config depreciacao ...

equip depreciacao ...

org criar ...
org buscar ID
org listar
org renovar ID --vencimento DATA

lote criar ...
lote adicionar-equipamento ...
lote triagem --lote ID

equip rastrear ID
equip movimentar ID --destino DESTINO --observacao "..."
equip estado ID --novo ESTADO --justificativa "..."
equip codigo --tipo TIPO --seq NUMERO

relatorio organizacao ID --inicio DATA --fim DATA
relatorio status STATUS
relatorio financeiro --inicio DATA --fim DATA
```

## 9. Estrutura de persistência
Os dados de execução ficam em `data/`. Entre os arquivos utilizados estão:
- `configuracao-mestre.json.enc`
- `credenciais.json.enc`
- `organizacoes.json.enc`
- `lotes.json.enc`
- `equipamentos.json.enc`
- `journal/journal.log`
- `.greencode_history`

Não versionar credenciais, chaves, tokens ou dados de execução que não sejam necessários para a entrega.

## 10. Segurança documentada
- Senhas com SHA-256 e salt.
- Sessões com token e expiração após 30 minutos de inatividade.
- Persistência protegida por AES-256.
- Escrita atômica no repositório.
- Journal com operação, entidade, dados antes/depois e responsável.

## 11. Testes
Execute `npm test` (jornada completa, cenários de falha e testes de segurança). Consulte `docs/Relatorio_de_Testes.md`, `docs/Matriz_de_Requisitos.md` e `docs/Arquitetura_de_Seguranca.md`.

## 12. Observações da entrega
Ver as limitações conhecidas em `docs/Arquitetura_de_Seguranca.md` (seção 6). Testes manuais de TAB, histórico e da expiração cronometrada de 30 minutos devem ser demonstrados na apresentação.

## 13. Estrutura das Pastas 
```
AV1
├── docs
│   ├── Arquitetura_de_Seguranca.md
│   ├── Matriz_de_Requisitos.md
│   └── Relatorio_de_Testes.md
├── src
│   ├── auditoria
│   │   └── JournalTransacao.ts
│   ├── autenticacao
│   │   ├── Autenticavel.ts
│   │   ├── Credencial.ts
│   │   ├── ServicoAutenticacao.ts
│   │   └── Sessao.ts
│   ├── cli
│   │   └── CLIInterface.ts
│   ├── configuracao
│   │   ├── GerenciadorConfiguracaoMestre.ts
│   │   └── ProvisionamentoInicial.ts
│   ├── fabricas
│   │   ├── FabricaContrato.ts
│   │   ├── FabricaEquipamento.ts
│   │   ├── FabricaLote.ts
│   │   └── FabricaOrganizacao.ts
│   ├── dominio
│   │   ├── Contrato.ts
│   │   ├── Equipamento.ts
│   │   ├── Lote.ts
│   │   ├── Movimentacao.ts
│   │   ├── Organizacao.ts
│   │   └── ParametrosGlobais.ts
│   ├── enums
│   │   ├── EstadoFisico.ts
│   │   ├── PapelUsuario.ts
│   │   ├── StatusLote.ts
│   │   ├── StatusRastreamento.ts
│   │   └── TipoEquipamento.ts
│   ├── persistencia
│   │   ├── CriptografiaArquivo.ts
│   │   └── RepositorioArquivo.ts
│   ├── servicos
│   │   ├── ServicoEquipamento.ts
│   │   ├── ServicoLote.ts
│   │   ├── ServicoOrganizacao.ts
│   │   └── ServicoRelatorio.ts
│   ├── validadores
│   │   ├── Validador.ts
│   │   ├── ValidadorCNPJ.ts
│   │   └── ValidadorDataEntrada.ts
│   └── index.ts
├── tests
│   ├── cenarios-falha.ts
│   ├── executar.ts
│   ├── jornada.ts
│   └── seguranca.ts
├── .gitignore
├── README.md
├── package-lock.json
├── package.json
└── tsconfig.json
```