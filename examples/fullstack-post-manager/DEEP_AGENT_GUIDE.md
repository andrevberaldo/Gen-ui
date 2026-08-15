# Deep Agent Integration Guide

Guia completo sobre como o Langchain Deep Agent funciona neste projeto.

## 🤖 O que é um Deep Agent?

Deep Agents são agentes inteligentes do Langchain que usam LLMs para:

1. **Entender** intenções complexas do usuário
2. **Raciocinar** sobre qual ação tomar
3. **Executar** ferramentas (tools) de forma iterativa
4. **Refletir** sobre resultados
5. **Gerar** saídas estruturadas

## 🏗️ Arquitetura do Deep Agent

```
┌─────────────────────────────────────────┐
│     User Query / Frontend Request        │
└─────────────────┬───────────────────────┘
                  │
                  ↓
        ┌─────────────────────┐
        │  Deep Agent Input   │
        │  "Busque post ID 5" │
        └─────────┬───────────┘
                  │
                  ↓
    ┌──────────────────────────────┐
    │  ChatOpenAI Model (GPT-4)     │
    │  - Analisa query              │
    │  - Seleciona tool             │
    │  - Gera A2UI JSON             │
    └──────────┬───────────────────┘
               │
               ↓
    ┌──────────────────────────────┐
    │  Tool Selection & Execution   │
    │  ┌────────────────────────┐   │
    │  │ SearchPostsTool        │   │
    │  │ UpdatePostTool         │   │
    │  │ ValidateEmailTool      │   │
    │  │ ValidatePostTitleTool  │   │
    │  └────────────────────────┘   │
    └──────────┬───────────────────┘
               │
               ↓
    ┌──────────────────────────────┐
    │  Tool Execution Result        │
    │  (API calls, validation)      │
    └──────────┬───────────────────┘
               │
               ↓
    ┌──────────────────────────────┐
    │  Agent Reasoning Loop         │
    │  (até 10 iterações)           │
    │  - Tool output retorna        │
    │  - Agent analisa resultado    │
    │  - Continua ou para           │
    └──────────┬───────────────────┘
               │
               ↓
    ┌──────────────────────────────┐
    │  A2UI Message Generation      │
    │  {                            │
    │    createSurface: {...},      │
    │    updateDataModel: {...},    │
    │    updateComponents: [...]    │
    │  }                            │
    └──────────┬───────────────────┘
               │
               ↓
        ┌──────────────┐
        │  Frontend    │
        │  Renderiza   │
        └──────────────┘
```

## 🔧 Implementação no Projeto

### 1. Inicialização do Agent

```javascript
// agent/agent.js
class DeepAgentExecutor {
  async initialize() {
    const agent = await createOpenAIFunctionsAgent({
      llm: this.model,           // GPT-4
      tools: this.tools,         // SearchPosts, UpdatePost, etc
      systemPrompt: "...",       // Instruções para gerar A2UI
    });

    this.executor = new AgentExecutor({
      agent,
      tools: this.tools,
      verbose: true,
      maxIterations: 10,         // Máximo de passos de raciocínio
    });
  }
}
```

### 2. Fluxo de Execução

```javascript
export async function runAgent(userMessage) {
  const result = await agentExecutor.invoke(userMessage);
  return result;
}
```

**O que acontece internamente:**

1. **Input**: `"Busque o post com ID 5"`

2. **LLM Analisa**:
   ```
   "O usuário quer um post específico.
    Devo usar SearchPostsTool com postId=5"
   ```

3. **Executa Tool**:
   ```javascript
   SearchPostsTool({
     postId: 5
   })
   ```

4. **Tool Retorna**:
   ```json
   {
     "createSurface": {...},
     "updateDataModel": {...},
     "updateComponents": [...]
   }
   ```

5. **Agent Processa Resultado**:
   ```
   "A tool retornou um post válido.
    Vou incluir esta resposta A2UI
    no resultado final."
   ```

6. **Output**: Mensagem A2UI estruturada

## 📋 System Prompt

O system prompt é crítico para direcionar o agent:

```javascript
const systemPrompt = `
Você é um assistente inteligente que gera interfaces dinâmicas 
usando o protocolo A2UI.

Quando um usuário faz uma requisição:
1. Analise a intenção
2. Execute ferramentas apropriadas
3. Gere uma resposta A2UI estruturada em JSON
4. A resposta deve incluir: 
   - createSurface (cria surface)
   - updateDataModel (insere dados)
   - updateComponents (renderiza componentes)

Sempre retorne respostas em JSON válido 
compatível com o protocolo A2UI.
`;
```

## 🔄 Tool Execution Loop

### Iteração 1: Buscar Post

```
Agent Input: "Busque o post com ID 5"
       ↓
LLM Decision: "Usar SearchPostsTool"
       ↓
Tool Call: SearchPostsTool({ postId: 5 })
       ↓
Tool Result: {
  createSurface: {...},
  updateDataModel: {...},
  updateComponents: [...]
}
       ↓
Agent Analysis: "Resultado satisfaz a requisição"
       ↓
Agent Output: A2UI Message
```

### Iteração 2: Editar Post (Mais Complexo)

```
Agent Input: "Edite o post 5: título='novo' corpo='novo corpo'"
       ↓
LLM Decision: "Validar título e corpo, depois atualizar"
       ↓
Tool Call 1: ValidatePostTitleTool({ title: 'novo' })
       ↓
Result 1: { isValid: true, ... }
       ↓
Tool Call 2: ValidatePostBodyTool({ body: 'novo corpo' })
       ↓
Result 2: { isValid: true, ... }
       ↓
Tool Call 3: UpdatePostTool({ postId: 5, title: '...', body: '...' })
       ↓
Result 3: { createSurface: {...}, ... }
       ↓
Agent Output: A2UI Message com sucesso
```

## 🛠️ Definindo Ferramentas

Cada tool deve herdar de `Tool` e definir:

```javascript
class SearchPostsTool extends Tool {
  name = "search_posts";
  description = "Busca posts no JSONPlaceholder";
  
  schema = z.object({
    postId: z.number().describe("ID do post")
  });

  async _call(input) {
    // Executar lógica
    // Retornar resultado como JSON string
    return JSON.stringify({
      createSurface: {...},
      updateDataModel: {...},
      updateComponents: [...]
    });
  }
}
```

**Importante**: Tools retornam **strings JSON**, não objetos!

## 🎯 A2UI Generation Strategy

O agent deve gerar A2UI seguindo este padrão:

### Para Buscar um Post

```json
{
  "createSurface": {
    "surfaceId": "post-5",
    "displayName": "Post #5"
  },
  "updateDataModel": {
    "surfaceId": "post-5",
    "path": "/post",
    "value": {
      "id": 5,
      "title": "...",
      "body": "...",
      "author": "..."
    }
  },
  "updateComponents": {
    "surfaceId": "post-5",
    "components": [
      {
        "id": "title",
        "type": "text",
        "properties": {
          "content": "${/post/title}",
          "variant": "h3"
        }
      },
      ...
    ]
  }
}
```

### Para Editar um Post

```json
{
  "updateComponents": {
    "surfaceId": "post-5",
    "components": [
      {
        "id": "success-alert",
        "type": "alert",
        "properties": {
          "message": "Post atualizado com sucesso!",
          "severity": "success"
        }
      },
      ...
    ]
  }
}
```

## 📊 Agent State Management

O agent mantém estado através da conversa:

```javascript
// Iteração N
{
  input: "Busque post 1, depois post 2, depois mostre os dois",
  toolCalls: [
    { tool: "search_posts", input: { postId: 1 } },
    { tool: "search_posts", input: { postId: 2 } },
  ],
  output: "A2UI com ambos os posts"
}
```

## 🚀 Optimization Tips

### 1. Max Iterations
```javascript
// Evita loops infinitos
maxIterations: 10  // Default, suficiente para maioria dos casos
```

### 2. Temperature
```javascript
// Controla aleatoriedade do LLM
temperature: 0    // Determinístico (recomendado para ferramentas)
temperature: 0.7  // Mais criativo (para respostas abertas)
```

### 3. Model Selection
```javascript
modelName: "gpt-4-turbo-preview"  // Mais inteligente
modelName: "gpt-3.5-turbo"        // Mais rápido, mais barato
```

### 4. Verbose Mode
```javascript
verbose: true   // Log detalhado (debug)
verbose: false  // Produção
```

## 🐛 Debug e Troubleshooting

### Ver o que o agent está fazendo

```javascript
const executor = new AgentExecutor({
  ...options,
  verbose: true,  // Mostra todas as iterações
});

// Output:
// > Entering new AgentExecutor...
// Thought: Devo buscar o post com ID 5
// Action: search_posts
// Action Input: { "postId": 5 }
// Observation: {"createSurface": {...}, ...}
// Thought: Tenho o resultado, posso retornar
// Final Answer: <A2UI JSON>
```

### Erros Comuns

#### 1. Tool retorna objeto em vez de string
```javascript
// ❌ ERRADO
return {
  createSurface: {...}
};

// ✅ CORRETO
return JSON.stringify({
  createSurface: {...}
});
```

#### 2. Schema Zod inválido
```javascript
// ❌ ERRADO
schema = {
  postId: "number"
};

// ✅ CORRETO
schema = z.object({
  postId: z.number().describe("ID do post")
});
```

#### 3. Tool name com espaços
```javascript
// ❌ ERRADO
name = "search posts";

// ✅ CORRETO
name = "search_posts";  // snake_case
```

## 🔗 Integração com Frontend

O frontend recebe a saída do agent e processa:

```javascript
// Backend
const result = await runAgent("Busque post 5");
const a2uiMessage = generateA2UIFromResult(result);

// Response
{
  createSurface: {...},
  updateDataModel: {...},
  updateComponents: [...]
}

// Frontend
processA2UIMessage(a2uiMessage);
```

## 📈 Performance Considerations

### Otimizações
1. **Cache de Executor**: Reutilizar o mesmo executor
2. **Validação Local**: Validar no renderer antes de chamar agent
3. **Batchingk**: Agrupar múltiplas operações
4. **Lazy Loading**: Carregar dados sob demanda

### Monitoramento
```javascript
// Medir tempo de execução
console.time("agent");
const result = await runAgent(query);
console.timeEnd("agent");

// Medir iterações
if (result.intermediateSteps) {
  console.log(`Tool calls: ${result.intermediateSteps.length}`);
}
```

## 📚 Referências

- [Langchain JS Docs](https://js.langchain.com/)
- [OpenAI Functions Agent](https://js.langchain.com/docs/modules/agents/agent_types/openai_functions_agent)
- [Tool Use](https://js.langchain.com/docs/modules/tools)
- [Agent Executor](https://js.langchain.com/docs/modules/agents/agent_executor)

## 🎓 Próximos Passos

1. ✅ Implementar SearchPostsTool
2. ✅ Implementar UpdatePostTool
3. ✅ Adicionar validação de entrada
4. 📝 Expandir com mais tools
5. 🔄 Implementar caching
6. 📊 Adicionar telemetria

---

**Versão**: Langchain v0.1.24+  
**Modelo**: GPT-4 Turbo Preview  
**Versão do Protocolo**: A2UI v1.0
