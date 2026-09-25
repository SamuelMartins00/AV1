# AV1 - Documentação

## 1. Sobre o projeto
O **greencode** é uma CLI em Node.js + TypeScript para o fluxo de logística reversa de resíduos eletrônicos. A proposta da AV1 combina domínio orientado a objetos, validações de negócio, autenticação, persistência local, criptografia e auditoria.

## 2. Requisitos
- Node.js
- npm

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

## 6. Verificação de TypeScript
```bash
npm run check
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
Consulte `Relatorio_de_Testes_GREENCODE.md` para a matriz de casos e `Matriz_de_Requisitos_GREENCODE.md` para a relação entre requisitos e evidências.

## 12. Observações da entrega
O relatório técnico registra também os pontos que ainda merecem demonstração ou complementação, especialmente teste manual de TAB/histórico, demonstração da expiração de 30 minutos e a regra de depreciação.

## 13. Estrutura das Pastas 
```
AV1
├── docs
│   ├── Matriz_de_Requisitos_GREENCODE.md
│   └── Relatorio_de_Testes_GREENCODE.md
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
│   ├── dominio
│   │   ├── Contrato.ts
│   │   ├── Equipamento.ts
│   │   ├── Lote.ts
│   │   ├── Movimentacao.ts
│   │   └── Organizacao.ts
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
│   ├── test1.ts
│   ├── test10.ts
│   ├── test2.ts
│   ├── test3.ts
│   ├── test4.ts
│   ├── test5.ts
│   ├── test6.ts
│   ├── test7.ts
│   ├── test8.ts
│   └── test9.ts
├── .gitignore
├── README.md
├── package-lock.json
├── package.json
└── tsconfig.json
```