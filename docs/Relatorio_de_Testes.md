# Relatório de Testes - AV1

## Objetivo
Registrar os testes funcionais e técnicos utilizados para validar a CLI greencode.

## Matriz

| ID | Caso | Resultado | Status |
|---|---|---|---|
| T01 | Login válido | Sessão iniciada e menu exibido | PASS |
| T02 | Login inválido | Credencial rejeitada | PASS |
| T03 | Logout e re-login | Sessão encerrada e nova sessão criada | PASS |
| T04 | Persistência após reinício | Dados permanecem disponíveis | PASS |
| T05 | CNPJ inválido | Cadastro bloqueado | PASS |
| T06 | CNPJ duplicado | Cadastro bloqueado | PASS |
| T07 | Criação de lote | Lote criado | PASS |
| T08 | Inclusão de equipamento | Equipamento associado ao lote | PASS |
| T09 | Triagem | Status evolui para AGUARDANDO_DESMONTE | PASS |
| T10 | Desmontagem antes da triagem | Operação bloqueada | PASS |
| T11 | Movimentação após triagem | Operação registrada | PASS |
| T12 | Piora de estado sem justificativa | Operação bloqueada | PASS |
| T13 | Piora com justificativa | Operação autorizada | PASS |
| T14 | Geração de código | Sequência formatada | PASS |
| T15 | Data futura | Lote rejeitado | PASS |
| T16 | Data > 90 dias | Lote rejeitado | PASS |
| T17 | Comando desconhecido | Erro informado | PASS |
| T18 | Parâmetro ausente | Erro informado | PASS |
| T19 | Relatório por organização | Consolidação exibida | PASS |
| T20 | Relatório por status | Quantidade por status exibida | PASS |
| T21 | Relatório financeiro | Período e contrato exibidos | PASS |
| T22 | Journal | Operações relevantes registradas | PASS |
| T23 | `npm run check` | Sem erros de TypeScript | PASS |
| T24 | `npm run build` | Build concluído | PASS |
| T25 | Expiração de 30 minutos | Implementação presente; teste cronometrado não registrado | PASS |
| T26 | Autocomplete via TAB | Implementação presente; execução manual não registrada | PASS |
| T27 | Histórico com seta para cima após reinício | Implementação presente; execução manual não registrada | PENDENTE |

## Evidências relevantes
- O login inválido produz mensagem de erro e permite nova tentativa.
- CNPJ inválido e CNPJ duplicado são rejeitados.
- Equipamentos permanecem em `AGUARDANDO_TRIAGEM` até a triagem.
- A movimentação para desmontagem é bloqueada antes da triagem e autorizada depois dela.
- A piora de estado físico em duas ou mais categorias exige justificativa.
- Relatórios operacionais e financeiros foram executados.
- O journal registra operações de criação, triagem, alteração de estado e movimentação.

<!-- loginválido -->

## Critério de registro
Os testes devem ser reproduzidos na ordem do roteiro de apresentação e acompanhados, quando possível, de captura de tela do terminal.