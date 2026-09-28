# Arquitetura de Segurança - greencode

## 1. Criptografia dos dados persistidos: AES-256-GCM
Todos os arquivos `.enc` (credenciais, organizações, lotes, equipamentos, configuração mestre) e cada linha do journal são cifrados com AES-256 no modo GCM.
- **Por que AES-256:** requisito da atividade; padrão simétrico consolidado, com aceleração por hardware.
- **Por que GCM:** é um modo autenticado. O `authTag` detecta adulteração do arquivo, não apenas vazamento. IV aleatório de 96 bits por operação de cifragem.
- **Chave:** 32 bytes aleatórios (`randomBytes`) gerados no provisionamento e normalizados por SHA-256 antes do uso.

## 2. Hash de senhas: SHA-256 com salt
- Salt aleatório de 16 bytes por usuário, armazenado junto ao hash; comparação em tempo constante (`timingSafeEqual`).
- **Justificativa:** SHA-256 é o algoritmo exigido pela atividade. O salt impede rainbow tables e torna hashes de senhas iguais distintos (coberto em `tests/seguranca.ts`).
- **Evolução:** em produção, migrar para função lenta (scrypt/argon2) na etapa com banco de dados.

## 3. Sessões: expiração após 30 minutos de inatividade
- Token aleatório (UUID v4), expiração deslizante: cada comando válido renova a sessão (`Sessao.renovar()`).
- Comando após expiração é rejeitado e o usuário deve autenticar novamente (aviso `[AVISO]`).
- **Justificativa:** reduz a janela de uso indevido de um terminal deixado aberto, sem prejudicar o fluxo operacional.

## 4. Autorização por papel (RBAC)
| Papel | Acesso |
|---|---|
| ADMINISTRADOR | Todos os comandos (inclui `usuario` e `config`) |
| OPERADOR_CADASTRO | `org` |
| GESTOR_ALMOXARIFADO | `lote`, `equip` |
| AUDITOR | `relatorio` e `equip rastrear` (somente leitura) |

O menu exibido e a execução de comandos respeitam a mesma matriz.

## 5. Integridade e auditoria
- **Escrita atômica:** arquivo temporário (permissão 0600) + `fsync` + `rename`; temporários são removidos em caso de erro.
- **Journal:** cada operação é registrada (com dados antes/depois e responsável) **antes** de ser aplicada ao estado. Troca de senha também é auditada, sem registrar senhas ou hashes.
- **Rotação:** ao ultrapassar 10 MB. **Retenção:** arquivos rotacionados são mantidos por 180 dias.

## 6. Limitações conhecidas
- A chave mestra fica no arquivo de configuração mestre (requisito da atividade), cifrado com uma chave de *bootstrap*. Por padrão essa chave está no código; defina `GREENCODE_BOOTSTRAP_KEY` no ambiente para que o arquivo só seja legível por quem possui esse segredo. A proteção definitiva (chave derivada de senha ou cofre do SO) fica para uma próxima etapa.
- `JournalTransacao.reverter()` apenas prepara os dados anteriores; não desfaz a operação no repositório.
- O journal é append-only por convenção do processo; não há assinatura encadeada (hash chain).

## 7. Cenários de falha testados
| Cenário | Resposta do sistema | Teste |
|---|---|---|
| Chave incorreta ao decifrar | Erro; dados não expostos | `seguranca.ts` |
| Arquivo cifrado adulterado | Rejeitado pelo `authTag` | `seguranca.ts` |
| Login inválido | Credencial rejeitada | `cenarios-falha.ts` |
| Sessão expirada | Comando rejeitado | `cenarios-falha.ts` |
| CNPJ inválido | Cadastro bloqueado | `cenarios-falha.ts` |
| CNPJ duplicado | Cadastro bloqueado | `seguranca.ts` |
| Lote com data futura ou > 90 dias | Rejeitado | `cenarios-falha.ts` |
| Desmonte sem triagem | Bloqueado | `jornada.ts` |
| Piora de 2+ estados sem justificativa | Bloqueado | `cenarios-falha.ts` |
| Journal acima de 10 MB | Rotação automática | `cenarios-falha.ts` |
| Journal com mais de 180 dias | Removido; recentes preservados | `seguranca.ts` |
| Escrita interrompida | Sem `.tmp` residual; dado anterior íntegro | `cenarios-falha.ts` |
