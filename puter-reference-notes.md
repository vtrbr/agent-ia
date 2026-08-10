
## Atualização em 2026-08-10

A documentação/tutorial oficial atualizada informa que o SDK Node requer Node.js 24 ou posterior e usa `init(process.env.PUTER_AUTH_TOKEN)` seguido de `puter.ai.chat(...)`. A documentação também mostra resposta textual em `response.message.content.toString()`. Neste ambiente o Node é 22.13.0; a chamada real com o token fornecido entrou em recursão no transporte WebSocket e terminou em `RangeError: Maximum call stack size exceeded`, portanto o próximo ajuste deve atualizar o runtime para Node 24 ou trocar o adaptador/transporte antes de declarar o pipeline real funcional.

Fontes consultadas:
- https://developer.puter.com/tutorials/puter-js-node-js/
- https://docs.puter.com/supported-platforms/
- https://docs.puter.com/getting-started/
