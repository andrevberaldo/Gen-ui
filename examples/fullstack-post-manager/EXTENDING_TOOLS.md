# Estendendo o Agent com Novas Ferramentas

Guia para adicionar novas ferramentas (tools) ao agente.

## 📋 Anatomia de uma Tool

```javascript
import { Tool } from "@langchain/core/tools";
import { z } from "zod";

class MyCustomTool extends Tool {
  // 1. Nome único da ferramenta (snake_case)
  name = "my_custom_tool";

  // 2. Descrição clara para o LLM entender quando usar
  description = "Descrição clara do que a ferramenta faz";

  // 3. Schema Zod dos parâmetros
  schema = z.object({
    param1: z.string().describe("Descrição do parâmetro 1"),
    param2: z.number().describe("Descrição do parâmetro 2"),
  });

  // 4. Implementação (_call sempre retorna string JSON)
  async _call(input) {
    try {
      // Seu código aqui
      const result = await doSomething(input);

      // IMPORTANTE: Retornar sempre como string JSON
      return JSON.stringify({
        createSurface: { ... },
        updateDataModel: { ... },
        updateComponents: [ ... ]
      });
    } catch (error) {
      return JSON.stringify({
        error: error.message
      });
    }
  }
}
```

## 🔧 Exemplo 1: Listar Todos os Posts

```javascript
class ListPostsTool extends Tool {
  name = "list_posts";
  description = "Lista todos os posts disponíveis (primeiros 10)";

  schema = z.object({
    limit: z.number().default(10).describe("Número máximo de posts (max 100)"),
  });

  async _call(input) {
    try {
      const response = await fetch(
        `https://jsonplaceholder.typicode.com/posts?_limit=${input.limit}`
      );
      const posts = await response.json();

      return JSON.stringify({
        createSurface: {
          surfaceId: "posts-list",
          displayName: "Posts Disponíveis",
        },
        updateDataModel: {
          surfaceId: "posts-list",
          path: "/posts",
          value: posts,
        },
        updateComponents: {
          surfaceId: "posts-list",
          components: [
            {
              id: "posts-heading",
              type: "text",
              properties: {
                content: `Total: ${posts.length} posts`,
                variant: "h5",
              },
            },
            {
              id: "posts-list",
              type: "list",
              properties: {
                items: "${/posts}",
                itemTemplate: {
                  type: "card",
                  properties: {
                    title: "${@item/title}",
                    subtitle: `ID: ${posts[0]?.id || 'N/A'}`,
                    content: "${@item/body}",
                  },
                },
              },
            },
          ],
        },
      });
    } catch (error) {
      return JSON.stringify({ error: error.message });
    }
  }
}
```

## 🎯 Exemplo 2: Criar um Novo Post

```javascript
class CreatePostTool extends Tool {
  name = "create_post";
  description = "Cria um novo post com título e corpo";

  schema = z.object({
    title: z.string().min(5).describe("Título do novo post"),
    body: z.string().min(10).describe("Corpo do novo post"),
    userId: z.number().default(1).describe("ID do usuário"),
  });

  async _call(input) {
    try {
      const response = await fetch(
        "https://jsonplaceholder.typicode.com/posts",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: input.title,
            body: input.body,
            userId: input.userId,
          }),
        }
      );

      const newPost = await response.json();

      return JSON.stringify({
        updateComponents: {
          surfaceId: "main",
          components: [
            {
              id: "creation-success",
              type: "alert",
              properties: {
                message: `Post criado com ID: ${newPost.id}`,
                severity: "success",
              },
            },
            {
              id: "new-post-card",
              type: "card",
              properties: {
                title: newPost.title,
                subtitle: `ID: ${newPost.id}`,
                content: newPost.body,
              },
            },
          ],
        },
      });
    } catch (error) {
      return JSON.stringify({ error: error.message });
    }
  }
}
```

## 🗑️ Exemplo 3: Deletar um Post

```javascript
class DeletePostTool extends Tool {
  name = "delete_post";
  description = "Deleta um post pelo ID";

  schema = z.object({
    postId: z.number().describe("ID do post a deletar"),
  });

  async _call(input) {
    try {
      const response = await fetch(
        `https://jsonplaceholder.typicode.com/posts/${input.postId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ao deletar post ${input.postId}`);
      }

      return JSON.stringify({
        updateComponents: {
          surfaceId: "main",
          components: [
            {
              id: "delete-success",
              type: "alert",
              properties: {
                message: `Post #${input.postId} deletado com sucesso`,
                severity: "success",
              },
            },
          ],
        },
      });
    } catch (error) {
      return JSON.stringify({ error: error.message });
    }
  }
}
```

## 📊 Exemplo 4: Tool com Transformação de Dados

```javascript
class GetUserPostsStatsTool extends Tool {
  name = "get_user_posts_stats";
  description = "Retorna estatísticas dos posts de um usuário";

  schema = z.object({
    userId: z.number().describe("ID do usuário"),
  });

  async _call(input) {
    try {
      const response = await fetch(
        `https://jsonplaceholder.typicode.com/posts?userId=${input.userId}`
      );
      const posts = await response.json();

      const stats = {
        totalPosts: posts.length,
        avgTitleLength: Math.round(
          posts.reduce((sum, p) => sum + p.title.length, 0) / posts.length
        ),
        avgBodyLength: Math.round(
          posts.reduce((sum, p) => sum + p.body.length, 0) / posts.length
        ),
      };

      return JSON.stringify({
        updateComponents: {
          surfaceId: "user-stats",
          components: [
            {
              id: "stats-title",
              type: "text",
              properties: {
                content: `Estatísticas do Usuário #${input.userId}`,
                variant: "h4",
              },
            },
            {
              id: "total-posts",
              type: "card",
              properties: {
                title: "Total de Posts",
                content: `${stats.totalPosts} posts`,
              },
            },
            {
              id: "avg-title",
              type: "card",
              properties: {
                title: "Comprimento Médio do Título",
                content: `${stats.avgTitleLength} caracteres`,
              },
            },
            {
              id: "avg-body",
              type: "card",
              properties: {
                title: "Comprimento Médio do Corpo",
                content: `${stats.avgBodyLength} caracteres`,
              },
            },
          ],
        },
      });
    } catch (error) {
      return JSON.stringify({ error: error.message });
    }
  }
}
```

## 🔌 Registrando Novas Tools

Após definir sua tool, adicione ao array em `tools.js`:

```javascript
import { SearchPostsTool } from "./tools.js";
import { ListPostsTool } from "./tools.js";
import { CreatePostTool } from "./tools.js";
import { DeletePostTool } from "./tools.js";

export const tools = [
  new SearchPostsTool(),
  new ListPostsTool(),
  new CreatePostTool(),
  new DeletePostTool(),
  new ValidateEmailTool(),
  new ValidatePostTitleTool(),
];
```

## 🏗️ Padrões e Melhores Práticas

### 1. Descrição Clara

```javascript
// ❌ RUIM
description = "Faz coisas"

// ✅ BOM
description = "Busca um post específico por ID no JSONPlaceholder e retorna com dados do autor"
```

### 2. Schema Bem Definido

```javascript
// ❌ RUIM
schema = z.object({ data: z.any() })

// ✅ BOM
schema = z.object({
  postId: z.number().min(1).max(100).describe("ID do post (1-100)"),
  includeAuthor: z.boolean().default(true).describe("Incluir dados do autor"),
})
```

### 3. Sempre Retornar String JSON

```javascript
// ❌ ERRADO
return { createSurface: {...} };

// ✅ CORRETO
return JSON.stringify({ createSurface: {...} });
```

### 4. Tratamento de Erros

```javascript
// ❌ RUIM - Deixar erro não tratado
async _call(input) {
  const result = await fetch(...);
  return JSON.stringify(result);
}

// ✅ BOM - Tratar e retornar erro em A2UI
async _call(input) {
  try {
    const result = await fetch(...);
    return JSON.stringify({
      createSurface: {...},
      updateComponents: [...]
    });
  } catch (error) {
    return JSON.stringify({
      error: error.message
    });
  }
}
```

### 5. Validação em Schema

```javascript
// ❌ RUIM - Validação manual
schema = z.object({ title: z.string() })
_call(input) {
  if (input.title.length < 5) throw new Error("...");
}

// ✅ BOM - Validação no schema
schema = z.object({
  title: z.string().min(5).describe("Mínimo 5 caracteres")
})
_call(input) {
  // input já foi validado
}
```

## 📝 Tool com Múltiplas Operações

```javascript
class ComplexOperationTool extends Tool {
  name = "complex_operation";
  description = "Faz operação complexa com múltiplas etapas";

  schema = z.object({
    postId: z.number(),
    newTitle: z.string(),
    newBody: z.string(),
  });

  async _call(input) {
    try {
      // Etapa 1: Validar entrada
      const validationErrors = [];
      if (input.newTitle.length < 5) {
        validationErrors.push("Título muito curto");
      }
      if (input.newBody.length < 10) {
        validationErrors.push("Corpo muito curto");
      }

      if (validationErrors.length > 0) {
        return JSON.stringify({
          updateComponents: {
            surfaceId: "main",
            components: [
              {
                id: "validation-error",
                type: "alert",
                properties: {
                  message: validationErrors.join(", "),
                  severity: "error",
                },
              },
            ],
          },
        });
      }

      // Etapa 2: Buscar post original
      const getResponse = await fetch(
        `https://jsonplaceholder.typicode.com/posts/${input.postId}`
      );
      const originalPost = await getResponse.json();

      // Etapa 3: Atualizar post
      const updateResponse = await fetch(
        `https://jsonplaceholder.typicode.com/posts/${input.postId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: input.postId,
            title: input.newTitle,
            body: input.newBody,
            userId: originalPost.userId,
          }),
        }
      );

      const updatedPost = await updateResponse.json();

      // Etapa 4: Gerar resposta A2UI
      return JSON.stringify({
        updateComponents: {
          surfaceId: `post-${input.postId}`,
          components: [
            {
              id: "success-alert",
              type: "alert",
              properties: {
                message: "Post atualizado com sucesso!",
                severity: "success",
              },
            },
            {
              id: "comparison",
              type: "card",
              properties: {
                title: "Comparação",
                content: `Antes: "${originalPost.title}"\nDepois: "${updatedPost.title}"`,
              },
            },
          ],
        },
      });
    } catch (error) {
      return JSON.stringify({ error: error.message });
    }
  }
}
```

## 🧪 Testando uma Nova Tool

```bash
# Adicione a tool ao array em tools.js
# Teste com curl:

curl -X POST http://localhost:3001/api/agent/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Liste todos os posts"}'
```

## 📚 Checklist para Nova Tool

- [ ] Nome em snake_case
- [ ] Descrição clara e concisa
- [ ] Schema Zod bem definido
- [ ] Tratamento de erros
- [ ] Retorna string JSON
- [ ] Gera A2UI válida
- [ ] Documentada
- [ ] Registrada em `tools.js`
- [ ] Testada

## 🎯 Próximas Ideias de Tools

1. **SearchPostsByKeyword** - Buscar posts por palavra-chave
2. **GetUserInfo** - Buscar informações de usuário
3. **GetComments** - Buscar comentários de um post
4. **ExportPostToPDF** - Exportar post para PDF
5. **GeneratePostSummary** - Gerar sumário com IA
6. **GetPostTrendingScore** - Calcular relevância
7. **BatchDeletePosts** - Deletar múltiplos posts
8. **SchedulePost** - Agendar publicação

---

**Versão**: Langchain v0.1.24+  
**Prototipo A2UI**: v1.0
