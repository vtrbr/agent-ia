# Referências oficiais usadas na expansão

- https://docs.puter.com/AI/chat/index.md — `puter.ai.chat()` aceita prompt ou array de mensagens com `system`/`user`; no modo não streaming retorna um objeto `ChatResponse`; `stream: true` retorna iterável assíncrono.
- https://docs.puter.com/supported-platforms/index.md — Puter.js suporta Node.js; a documentação atual usa `init` de `@heyputer/puter.js/src/init.cjs` com token de autenticação.
- https://docs.puter.com — exemplos oficiais de chat, streaming e integração geral do SDK.

Esses contratos fundamentam o adaptador `puterService.js`, que usa mensagens estruturadas, `stream: false`, normalização de `message.content`/blocos textuais e erro explícito quando o token não está configurado.
