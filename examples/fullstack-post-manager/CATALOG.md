# Catálogo A2UI - Post Manager

Este documento descreve o catálogo completo de componentes e funções disponíveis neste exemplo.

## 📦 Componentes

### text
Exibe texto com diferentes variantes de tipografia.

**Propriedades:**
```json
{
  "id": "my-text",
  "type": "text",
  "properties": {
    "content": "Olá, mundo!",
    "variant": "h3"  // h1-h6, body1, body2, caption
  }
}
```

**Com Data Binding:**
```json
{
  "content": "${/post/title}",  // Usa valor de data model
  "variant": "h2"
}
```

### button
Botão clicável que dispara uma ação.

**Propriedades:**
```json
{
  "id": "edit-btn",
  "type": "button",
  "properties": {
    "label": "Editar",
    "variant": "contained",  // contained, outlined, text
    "disabled": false,
    "onClick": {
      "name": "openEditForm",
      "context": { "postId": 1 }
    }
  }
}
```

### card
Card com título, subtítulo e conteúdo.

**Propriedades:**
```json
{
  "id": "post-card",
  "type": "card",
  "properties": {
    "title": "Título do Post",
    "subtitle": "Por João Silva",
    "content": "Conteúdo principal...",
    "elevation": 2  // Nível de sombra (0-24)
  }
}
```

### text-input
Campo de entrada de texto com validação opcional.

**Propriedades:**
```json
{
  "id": "title-input",
  "type": "text-input",
  "properties": {
    "label": "Título",
    "placeholder": "Digite o título...",
    "value": "${/formData/title}",
    "required": true,
    "onChange": {
      "name": "onTitleChange",
      "context": {}
    }
  }
}
```

### loading
Indicador de carregamento com mensagem.

**Propriedades:**
```json
{
  "id": "loader",
  "type": "loading",
  "properties": {
    "message": "Carregando posts..."
  }
}
```

### alert
Alerta/notificação com diferentes severidades.

**Propriedades:**
```json
{
  "id": "success-msg",
  "type": "alert",
  "properties": {
    "message": "Post atualizado com sucesso!",
    "severity": "success"  // success, error, warning, info
  }
}
```

### list
Lista renderizando múltiplos items com template.

**Propriedades:**
```json
{
  "id": "posts-list",
  "type": "list",
  "properties": {
    "items": "${/posts}",  // Array de items
    "itemTemplate": {
      "type": "card",
      "properties": {
        "title": "${@item/title}",
        "subtitle": "ID: ${@item/id}",
        "content": "${@item/body}"
      }
    }
  }
}
```

**Context Variables:**
- `${@item}` - O item atual
- `${@index}` - Índice do item

### container
Contêiner para layout com espaçamento.

**Propriedades:**
```json
{
  "id": "form-container",
  "type": "container",
  "properties": {
    "spacing": 2  // Espaçamento em unidades MUI
  },
  "children": [
    { "type": "text", "properties": {...} },
    { "type": "button", "properties": {...} }
  ]
}
```

## 🔧 Funções

### Funções do Agente

#### searchPosts
Busca um post específico pelo ID.

**Parâmetros:**
```json
{
  "postId": 1
}
```

**Retorna:**
- A2UI message com card mostrando post
- Inclui título, autor, email do autor
- Botão "Editar Post" para ação

#### updatePost
Atualiza um post existente.

**Parâmetros:**
```json
{
  "postId": 1,
  "title": "Novo Título (5-100 chars)",
  "body": "Novo corpo (10+ chars)"
}
```

**Validações:**
- Título: min 5, max 100 caracteres
- Corpo: min 10 caracteres
- Sem caracteres especiais inválidos

**Retorna:**
- Alert de sucesso
- A2UI message com post atualizado

#### validateEmail
Valida se um email é válido.

**Parâmetros:**
```json
{
  "email": "user@example.com"
}
```

**Retorna:**
```json
{
  "email": "user@example.com",
  "isValid": true,
  "message": "Email válido"
}
```

#### validatePostTitle
Valida se um título segue as regras.

**Parâmetros:**
```json
{
  "title": "Meu Novo Post"
}
```

**Validações:**
- Comprimento: 5-100 caracteres
- Caracteres válidos: a-z, A-Z, 0-9, espaço, pontuação
- Sem caracteres especiais

**Retorna:**
```json
{
  "title": "Meu Novo Post",
  "isValid": true,
  "issues": [],
  "message": "Título válido"
}
```

### Funções do Renderer

#### validateEmail
Valida email no browser (antes de enviar ao servidor).

```javascript
// Implementação em renderer-functions.js
const result = await rendererFunctions.validateEmail({
  email: "user@example.com"
});
// → { isValid: true, message: "Email válido ✓" }
```

#### validatePostTitle
Valida título em tempo real no formulário.

```javascript
const result = await rendererFunctions.validatePostTitle({
  title: "Meu Post"
});
// → { isValid: true, issues: [] }
```

#### validatePostBody
Valida corpo do post (10-1000 caracteres).

```javascript
const result = await rendererFunctions.validatePostBody({
  body: "Conteúdo do post..."
});
// → { isValid: true, issues: [] }
```

#### formatDate
Formata data para o padrão português.

```javascript
const result = await rendererFunctions.formatDate({
  date: "2024-08-15T10:30:00Z"
});
// → { formatted: "15/08/2024" }
```

#### highlightText
Destaca palavras-chave em um texto.

```javascript
const result = await rendererFunctions.highlightText({
  text: "Este é um texto de teste",
  keywords: ["texto", "teste"]
});
// → { highlighted: "Este é um <mark>texto</mark>..." }
```

## 🔗 Data Binding

### Sintaxe JSON Pointer
```json
{
  "content": "${/post/title}",     // post.title
  "subtitle": "${/post/author}",   // post.author
  "items": "${/posts/0/title}"     // posts[0].title
}
```

### Context Variables (Em Listas)
```json
{
  "title": "${@item/title}",       // Item atual
  "badge": "Item ${@index}"        // Índice
}
```

## 📊 Data Model Example

```javascript
{
  "post": {
    "id": 1,
    "title": "sunt aut facere repellat...",
    "body": "quia et suscipit...",
    "author": "Leanne Graham",
    "authorEmail": "Sincere@april.biz",
    "userId": 1
  },
  "posts": [
    { "id": 1, "title": "...", "body": "..." },
    { "id": 2, "title": "...", "body": "..." }
  ],
  "formData": {
    "title": "",
    "body": "",
    "errors": []
  }
}
```

## 🎯 Exemplo Completo

### Mensagem A2UI Completa

```json
{
  "createSurface": {
    "surfaceId": "post-editor",
    "displayName": "Editor de Post"
  },
  "updateDataModel": {
    "surfaceId": "post-editor",
    "path": "/post",
    "value": {
      "id": 1,
      "title": "Meu Post",
      "body": "Conteúdo...",
      "author": "João"
    }
  },
  "updateComponents": {
    "surfaceId": "post-editor",
    "components": [
      {
        "id": "title",
        "type": "text",
        "properties": {
          "content": "Editando: ${/post/title}",
          "variant": "h3"
        }
      },
      {
        "id": "title-input",
        "type": "text-input",
        "properties": {
          "label": "Título",
          "value": "${/post/title}",
          "required": true
        }
      },
      {
        "id": "body-input",
        "type": "text-input",
        "properties": {
          "label": "Corpo",
          "value": "${/post/body}",
          "required": true
        }
      },
      {
        "id": "save-btn",
        "type": "button",
        "properties": {
          "label": "Salvar",
          "variant": "contained",
          "onClick": {
            "name": "savePost",
            "context": { "postId": 1 }
          }
        }
      }
    ]
  }
}
```

## 🚨 Tratamento de Erros

### Validação Falha

Quando uma validação falha, o renderer retorna um A2UI com alert:

```json
{
  "updateComponents": {
    "surfaceId": "form",
    "components": [
      {
        "id": "error-alert",
        "type": "alert",
        "properties": {
          "message": "Problemas: Título deve ter pelo menos 5 caracteres",
          "severity": "error"
        }
      }
    ]
  }
}
```

### API Error

Se a API falha, o agente gera:

```json
{
  "updateComponents": {
    "surfaceId": "main",
    "components": [
      {
        "id": "error",
        "type": "alert",
        "properties": {
          "message": "Erro ao buscar post: Not Found",
          "severity": "error"
        }
      }
    ]
  }
}
```

## 🎨 Mapeamento para Material UI

| A2UI Component | Material UI | Propriedades Mapeadas |
|---|---|---|
| text | Typography | variant, content |
| button | Button | label→children, variant, disabled |
| card | Card | title→CardHeader, content→CardContent |
| text-input | TextField | label, placeholder, value, required |
| loading | CircularProgress | message (com Box) |
| alert | Alert | message, severity |
| list | List | items, itemTemplate |
| container | Box | spacing, children |

---

**Próximos Passos:** [Voltar ao README](./README.md)
