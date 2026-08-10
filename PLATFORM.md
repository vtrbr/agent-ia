# Agent-IA Platform

O Agent-IA agora possui uma fundação de plataforma além do pipeline original. Cada projeto recebe um identificador próprio, um workspace separado e um histórico de execução associado. O gateway mantém compatibilidade com `POST /api/build`, mas também oferece uma API orientada a projetos.

## Arquitetura atual

| Componente | Responsabilidade |
|---|---|
| `src/server.js` | Gateway HTTP, projetos, builds, consulta de arquivos e streaming SSE. |
| `src/services/projectStore.js` | Persistência local dos metadados dos projetos em `data/projects.json`. |
| `src/services/jobQueue.js` | Fila sequencial de jobs, estados, histórico de eventos e assinaturas. |
| `src/services/tools.js` | Operações de workspace com isolamento por projeto e proteção contra traversal. |
| `src/orchestrator.js` | Pipeline multiagente, agora recebendo `projectId` e emitindo progresso. |
| `src/services/puterService.js` | Adaptador do Puter com resposta textual normalizada e erro explícito de autenticação. |

## Fluxo recomendado

Primeiro crie um projeto com `POST /api/projects`. Em seguida envie uma solicitação para `POST /api/projects/:projectId/build`. A API retorna um `jobId` imediatamente, enquanto o worker executa o pipeline em segundo plano. O estado pode ser consultado em `GET /api/build/:jobId`, e os eventos podem ser consumidos em `GET /api/build/:jobId/events` usando Server-Sent Events.

A API também oferece `GET /api/projects/:projectId/files` para listar os arquivos gerados e `GET /api/projects/:projectId/files/*` para ler um arquivo dentro do workspace isolado. Caminhos fora do projeto são rejeitados.

## Execução local

```bash
cd lovable-backend
npm install
export PUTER_AUTH_TOKEN="seu-token-do-puter"
npm test
npm start
```

O token do Puter é necessário para o pipeline avançar além dos fallbacks locais. Sem ele, o job é marcado como `failed` e o evento `job.failed` informa a causa, em vez de apresentar um falso sucesso.

## Próximas camadas

A fila atual é deliberadamente local e sequencial. Para produção, a próxima camada deve substituir o armazenamento JSON por PostgreSQL ou SQLite com migrações, usar uma fila durável com retry e leases, adicionar autenticação por usuário, limitar recursos dos workspaces, executar comandos em sandbox isolado e mover os eventos para um broker ou mecanismo de streaming compartilhado. A interface web deverá consumir os eventos do job para exibir o plano, os arquivos, os testes, as correções e o preview gerado.
