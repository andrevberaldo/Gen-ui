# Exemplos de Uso - A2UI Post Manager

Exemplos práticos de como o sistema funciona de ponta a ponta.

## 1️⃣ Buscar um Post

### Fluxo do Usuário

```
Usuario abre app → Digita ID "5" → Clica "Buscar"
```

### O que Acontece

#### 1. Frontend envia query ao agente
```javascript
// POST /api/agent/query
{
  "query": "Busque o post com ID 5"
}
```

#### 2. Agente processa com Langchain
```
Agente recebe a query
→ Analisa: é um pedido de busca de post
→ Chama SearchPostsTool
→ Tool busca em JSONPlaceholder
→ Retorna post com autor
```

#### 3. Agente gera A2UI
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
      "title": "nesciunt quas odio",
      "body": "repudiandae veniam quaerat sunt...",
      "author": "Chelsey Dietrich",
      "authorEmail": "Lucio_Hettinger@annie.ca",
      "userId": 2
    }
  },
  "updateComponents": {
    "surfaceId": "post-5",
    "components": [
      {
        "id": "post-title",
        "type": "text",
        "properties": {
          "content": "${/post/title}",
          "variant": "h3"
        }
      },
      {
        "id": "post-author",
        "type": "text",
        "properties": {
          "content": "Por: ${/post/author} (${/post/authorEmail})",
          "variant": "caption"
        }
      },
      {
        "id": "post-body",
        "type": "text",
        "properties": {
          "content": "${/post/body}",
          "variant": "body1"
        }
      },
      {
        "id": "edit-button",
        "type": "button",
        "properties": {
          "label": "Editar Post",
          "variant": "contained",
          "onClick": {
            "name": "openEditForm",
            "context": { "postId": 5 }
          }
        }
      }
    ]
  }
}
```

#### 4. Frontend renderiza
```jsx
// React renderiza:
<Card>
  <CardHeader title="nesciunt quas odio" />
  <CardContent>
    <Typography>Por: Chelsey Dietrich...</Typography>
    <Typography>repudiandae veniam quaerat...</Typography>
    <Button>Editar Post</Button>
  </CardContent>
</Card>
```

### Resultado Visual
```
┌─────────────────────────────┐
│ Post #5                     │
├─────────────────────────────┤
│ nesciunt quas odio          │
│                             │
│ Por: Chelsey Dietrich       │
│ (Lucio_Hettinger@...)       │
│                             │
│ repudiandae veniam quaerat  │
│ sunt...                     │
│                             │
│ [   Editar Post   ]         │
└─────────────────────────────┘
```

---

## 2️⃣ Editar um Post

### Fluxo do Usuário

```
Clica "Editar Post" → Sistema mostra formulário → 
Digita título e corpo → Clica "Salvar"
```

### O que Acontece

#### 1. Usuário clica "Editar Post"
```javascript
// Frontend dispara ação
onAction({
  name: "openEditForm",
  context: { postId: 5 }
})
```

#### 2. Frontend chama agente
```javascript
// POST /api/agent/query
{
  "query": "Prepare um formulário de edição para o post ID 5"
}
```

#### 3. Agente gera formulário A2UI
```json
{
  "updateComponents": {
    "surfaceId": "post-5-editor",
    "components": [
      {
        "id": "form-title",
        "type": "text",
        "properties": {
          "content": "Editar Post #5",
          "variant": "h4"
        }
      },
      {
        "id": "title-input",
        "type": "text-input",
        "properties": {
          "label": "Título",
          "placeholder": "Digite o novo título",
          "value": "${/form/title}",
          "required": true
        }
      },
      {
        "id": "body-input",
        "type": "text-input",
        "properties": {
          "label": "Corpo",
          "placeholder": "Escreva o novo conteúdo",
          "value": "${/form/body}",
          "required": true
        }
      },
      {
        "id": "save-button",
        "type": "button",
        "properties": {
          "label": "Salvar Alterações",
          "variant": "contained",
          "onClick": {
            "name": "savePost",
            "context": { "postId": 5 }
          }
        }
      }
    ]
  }
}
```

#### 4. Usuário digita e Renderer valida

**Evento:** Usuário digita "novo titulo"

```javascript
// Renderer chama função de validação
rendererFunctions.validatePostTitle({
  title: "novo titulo"
})

// Resposta:
{
  isValid: false,
  issues: ["Título deve ter pelo menos 5 caracteres"],
  message: "Problemas: Título deve ter pelo menos 5 caracteres"
}
```

**Renderer mostra mensagem:**
```
[Alerta] ⚠️ Problemas: Título deve ter pelo menos 5 caracteres
```

**Usuário digita "novo titulo para o post":**

```javascript
rendererFunctions.validatePostTitle({
  title: "novo titulo para o post"
})

// Resposta:
{
  isValid: true,
  issues: [],
  message: "Título válido ✓"
}
```

**Renderer mostra:**
```
[Sucesso] ✓ Título válido
```

#### 5. Usuário clica "Salvar"

```javascript
// Frontend chama agente
await callAgentFunction("updatePost", {
  postId: 5,
  title: "novo titulo para o post",
  body: "este eh o novo corpo do post..."
})
```

#### 6. Agente valida no servidor

```javascript
// Agente executa UpdatePostTool
UpdatePostTool._call({
  postId: 5,
  title: "novo titulo para o post",
  body: "este eh o novo corpo do post..."
})

// Validação:
// ✓ title: "novo titulo para o post" (23 chars, > 5)
// ✓ body: "este eh o novo corpo..." (25+ chars, > 10)
// ✓ Sem caracteres inválidos
```

#### 7. Tool busca na API

```
PUT /posts/5
{
  "id": 5,
  "title": "novo titulo para o post",
  "body": "este eh o novo corpo do post...",
  "userId": 1
}

Resposta (mock do JSONPlaceholder):
{
  "id": 5,
  "title": "novo titulo para o post",
  "body": "este eh o novo corpo do post...",
  "userId": 1
}
```

#### 8. Tool gera A2UI de sucesso

```json
{
  "updateDataModel": {
    "surfaceId": "post-5",
    "path": "/post",
    "value": {
      "id": 5,
      "title": "novo titulo para o post",
      "body": "este eh o novo corpo do post..."
    }
  },
  "updateComponents": {
    "surfaceId": "post-5",
    "components": [
      {
        "id": "success-alert",
        "type": "alert",
        "properties": {
          "message": "Post #5 atualizado com sucesso!",
          "severity": "success"
        }
      },
      {
        "id": "updated-title",
        "type": "text",
        "properties": {
          "content": "novo titulo para o post",
          "variant": "h3"
        }
      },
      {
        "id": "updated-body",
        "type": "text",
        "properties": {
          "content": "este eh o novo corpo do post...",
          "variant": "body1"
        }
      }
    ]
  }
}
```

#### 9. Frontend renderiza resultado

```
┌──────────────────────────────┐
│ ✓ Post #5 atualizado com     │
│   sucesso!                   │
├──────────────────────────────┤
│ novo titulo para o post      │
│                              │
│ este eh o novo corpo do      │
│ post...                      │
└──────────────────────────────┘
```

---

## 3️⃣ Validação em Tempo Real

### Exemplo: Validar Email

```javascript
// Usuário digita email
const email = "usuario@example.com"

// Renderer chama função
const result = await rendererFunctions.validateEmail({
  email: "usuario@example.com"
})

// Resposta
{
  email: "usuario@example.com",
  isValid: true,
  message: "Email válido ✓"
}
```

### Exemplo: Email Inválido

```javascript
const result = await rendererFunctions.validateEmail({
  email: "usuario@invalid"
})

// Resposta
{
  email: "usuario@invalid",
  isValid: false,
  message: "Email inválido. Deve ser um email válido"
}
```

---

## 4️⃣ Lista de Posts

### Query do Usuário
```
"Mostre os primeiros 5 posts"
```

### A2UI Gerado

```json
{
  "createSurface": {
    "surfaceId": "posts-list",
    "displayName": "Posts"
  },
  "updateDataModel": {
    "surfaceId": "posts-list",
    "path": "/posts",
    "value": [
      {"id": 1, "title": "sunt aut...", "body": "quia et..."},
      {"id": 2, "title": "qui est...", "body": "est rerum..."},
      {"id": 3, "title": "ea molestias...", "body": "tenetur..."},
      {"id": 4, "title": "eum et...", "body": "voluptates..."},
      {"id": 5, "title": "novo titulo...", "body": "este eh..."}
    ]
  },
  "updateComponents": {
    "surfaceId": "posts-list",
    "components": [
      {
        "id": "posts-heading",
        "type": "text",
        "properties": {
          "content": "Posts Recentes",
          "variant": "h4"
        }
      },
      {
        "id": "posts-list",
        "type": "list",
        "properties": {
          "items": "${/posts}",
          "itemTemplate": {
            "type": "card",
            "properties": {
              "title": "${@item/title}",
              "subtitle": "ID: ${@item/id}",
              "content": "${@item/body}",
              "elevation": 1
            }
          }
        }
      }
    ]
  }
}
```

### Renderização

```
Posts Recentes

┌─────────────────────┐
│ sunt aut...         │
│ ID: 1               │
│ quia et sus...      │
└─────────────────────┘

┌─────────────────────┐
│ qui est...          │
│ ID: 2               │
│ est rerum...        │
└─────────────────────┘

┌─────────────────────┐
│ ea molestias...     │
│ ID: 3               │
│ tenetur...          │
└─────────────────────┘

...
```

---

## 5️⃣ Tratamento de Erro

### Usuário busca post que não existe

```
Query: "Busque o post com ID 999"
```

### Tool Executa

```javascript
// Buscar em JSONPlaceholder
GET /posts/999
→ 404 Not Found

// Tool captura erro
return JSON.stringify({
  error: "Post com ID 999 não encontrado"
})
```

### A2UI de Erro

```json
{
  "updateComponents": {
    "surfaceId": "main",
    "components": [
      {
        "id": "error-alert",
        "type": "alert",
        "properties": {
          "message": "Post com ID 999 não encontrado",
          "severity": "error"
        }
      }
    ]
  }
}
```

### Frontend Renderiza

```
┌────────────────────────────────┐
│ ❌ Post com ID 999 não encontrado│
└────────────────────────────────┘
```

---

## 🔄 Sequência Completa de Mensagens

```
1. USUARIO
   └─→ Digita ID e clica Buscar

2. FRONTEND
   └─→ POST /api/agent/query
       {
         "query": "Busque o post com ID 5"
       }

3. BACKEND (Express)
   └─→ Chama runAgent()

4. AGENTE (Langchain)
   └─→ Analisa query
   └─→ Executa SearchPostsTool
   └─→ Retorna A2UI

5. FRONTEND
   └─→ Recebe A2UI
   └─→ processA2UIMessage()
   └─→ Renderiza com A2UIRenderer

6. USUARIO
   └─→ Vê o post renderizado
   └─→ Clica "Editar Post"

7. FRONTEND
   └─→ Dispara onAction()
   └─→ POST /api/agent/query
       {
         "query": "Prepare formulário de edição..."
       }

8. AGENTE
   └─→ Gera A2UI com formulário

9. FRONTEND
   └─→ Renderiza formulário

10. USUARIO
    └─→ Preenche formulário
    └─→ Renderer valida em tempo real
    └─→ Clica "Salvar"

11. AGENTE
    └─→ Executa UpdatePostTool
    └─→ Valida título e corpo
    └─→ Chama API JSONPlaceholder
    └─→ Retorna A2UI de sucesso

12. FRONTEND
    └─→ Renderiza sucesso

13. USUARIO
    └─→ Vê mensagem de sucesso
    └─→ Post atualizado
```

---

**Referências:** [Catálogo Completo](./CATALOG.md) | [README](./README.md)
