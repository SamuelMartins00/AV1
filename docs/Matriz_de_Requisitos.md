# Matriz de Requisitos - AV1

| Requisito | Situação registrada | Observação |
|---|---|---|
| CLI greencode | Atendido | Interface CLI operacional |
| Node.js + TypeScript | Atendido | Projeto usa TypeScript e scripts npm |
| Quatro papéis de usuário | Implementado | Menus/permissões previstos; execução manual concentrada no ADMINISTRADOR |
| SHA-256 nas senhas | Implementado | Credencial usa hash com salt |
| Sessão de 30 min | Implementado | Mecanismo presente; falta evidência cronometrada |
| Provisionamento inicial | Implementado na inicialização | Evidência registrada refere configuração mestre já existente |
| AES-256 na persistência | Implementado | Arquivos `.enc` usados na persistência |
| Escrita atômica | Implementado | Repositório usa temporário + substituição |
| Journal/auditoria | Atendido | Operações registradas com antes/depois |
| Retenção/rotação de journal | Implementado no componente | Teste de 10 MB/180 dias não registrado |
| CNPJ válido e único | Atendido | Testes de inválido e duplicado passaram |
| Data do lote | Atendido | Futuro e anterior a 90 dias bloqueados |
| Triagem antes de desmontagem | Atendido | Regra validada antes/depois da triagem |
| Justificativa em piora grave | Atendido | Regra validada |
| Autocomplete | Implementado | Demonstrar TAB na apresentação |
| Histórico persistente | Implementado | Demonstrar seta para cima após reinício |
| Feedback de sucesso/erro | Atendido | Mensagens categorizadas |
| Relatórios | Atendido | Organização, status e financeiro |
| Gestão de contas/parâmetros globais | Ponto de revisão | Não aparece no menu CLI documentado atualmente |
| `calcularDepreciacao()` | Ponto de revisão | Método de domínio permanece sem regra implementada no estado documentado |
| Compatibilidade Windows/Linux | Prevista | Validada principalmente em Windows no conjunto de evidências disponível |
