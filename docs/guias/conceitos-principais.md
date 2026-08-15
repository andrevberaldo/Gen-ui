# Conceitos Principais de A2UI

Entenda os blocos de construção fundamentais do protocolo A2UI.

## Superfícies (Surfaces)

Uma **superfície** é um espaço isolado onde componentes de UI são renderizados. Você pode ter múltiplas superfícies simultâneas, cada uma com seu próprio estado e ciclo de vida.

### Exemplo
```json
{
  "createSurface": {
    "surfaceId": "chat-results",
    "displayName": "Resultados da Busca"
  }
}
```

**Casos de Uso**:
- Chat principal vs. resultado da busca
- Múltiplas abas em uma aplicação
- Sobreposições ou modais
- Painel lateral vs. conteúdo principal

## Componentes

Um **componente** é uma unidade básica de UI renderizável. Cada componente tem:
- **id**: Identificador único na superfície
- **type**: Tipo de componente (button, text, card, etc.)
- **properties**: Configurações do componente
- **children**: Componentes filhos (se aplicável)

### Exemplo
```json
{
  "id": "submit-button",
  "type": "button",
  "properties": {
    "label": "Enviar",
    "disabled": false,
    "style": "primary"
  }
}
```

### Hierarquia de Componentes
Os componentes podem ter filhos, criando uma árvore:

```
┌─ card (id: "user-card")
│  ├─ text (id: "name-text")
│  ├─ text (id: "email-text")
│  └─ button (id: "delete-btn")
```

## Modelo de Dados (Data Model)

O **modelo de dados** é um armazenamento estruturado de valores que componentes podem usar dinamicamente. Usa caminhos JSON Pointer-like para acesso.

### Exemplo
```json
{
  "updateDataModel": {
    "surfaceId": "profile",
    "path": "/user/name",
    "value": "Maria Silva"
  }
}
```

Agora componentes podem referenciar `/user/name` em suas propriedades.

### Ligação de Dados (Data Binding)
Componentes podem referenciar valores do modelo de dados:

```json
{
  "id": "greeting",
  "type": "text",
  "properties": {
    "content": "${/user/name}"
  }
}
```

Quando o modelo de dados muda, a UI atualiza automaticamente sem ressintonizar.

## Catálogos

Um **catálogo** define quais componentes e funções estão disponíveis para um agente usar.

### Exemplo
```json
{
  "catalogs": {
    "default": {
      "components": {
        "button": {
          "description": "Um botão clicável",
          "properties": {
            "label": {"type": "string"},
            "disabled": {"type": "boolean"}
          }
        },
        "card": {
          "description": "Um cartão para exibir conteúdo"
        }
      },
      "functions": {
        "submitForm": {
          "description": "Enviar formulário",
          "parameters": {
            "data": {"type": "object"}
          }
        }
      }
    }
  }
}
```

### Por que Catálogos?
- **Segurança**: Agentes só podem usar o que você aprova
- **Validação**: Saiba que os componentes existem antes de renderizá-los
- **Documentação**: LLMs entendem o que está disponível

## Ações (Actions)

Uma **ação** é a resposta do usuário quando interage com a UI. O renderizador envia ações de volta ao agente.

### Exemplo
```json
{
  "action": {
    "name": "submit",
    "context": {
      "formId": "contact-form",
      "data": {
        "name": "João",
        "email": "joao@example.com"
      }
    }
  }
}
```

## Funções Personalizadas

Além de componentes pré-construídos, você pode definir **funções personalizadas** que agentes podem chamar.

### Tipos de Função

#### 1. Funções do Renderizador
Funções executadas no lado do cliente (renderizador):

```json
{
  "callRendererFunction": {
    "functionName": "validateEmail",
    "parameters": {
      "email": "user@example.com"
    }
  }
}
```

#### 2. Funções do Agente
Funções executadas no lado do agente:

```json
{
  "callAgentFunction": {
    "functionName": "searchDatabase",
    "parameters": {
      "query": "pizza",
      "location": "São Paulo"
    }
  }
}
```

## Eventos e Ligação de Eventos

Componentes podem gerar eventos quando o usuário interage com eles.

### Exemplo
```json
{
  "id": "submit-btn",
  "type": "button",
  "properties": {
    "label": "Enviar",
    "onPress": {
      "name": "submit",
      "context": {
        "formId": "main-form"
      }
    }
  }
}
```

Quando clicado, o botão emite:
```json
{
  "action": {
    "name": "submit",
    "context": {
      "formId": "main-form"
    }
  }
}
```

## Contexto e Escopos

O **contexto** permite que dados de componentes pai sejam acessados por filhos. Isso é crítico para iterações e repetição.

### Exemplo: Renderizar Lista de Restaurantes

```json
{
  "id": "restaurants-list",
  "type": "list",
  "properties": {
    "items": ["${/restaurants}"],
    "itemTemplate": {
      "id": "restaurant-${@index}",
      "type": "card",
      "properties": {
        "title": "${@item/name}",
        "subtitle": "${@item/rating} ⭐ • ${@item/distance}",
        "action": {
          "name": "selectRestaurant",
          "context": {
            "restaurantId": "${@item/id}"
          }
        }
      }
    }
  }
}
```

**Variáveis Especiais**:
- `@index`: Índice do item na lista
- `@item`: Objeto item atual
- `@parent`: Contexto pai

## Tipos de Dados Suportados

A2UI suporta tipos JSON padrão:

| Tipo | Exemplo | Uso |
|------|---------|-----|
| **string** | `"Olá"` | Textos, labels |
| **number** | `42`, `3.14` | Contagens, valores |
| **boolean** | `true`, `false` | Flags, booleanos |
| **array** | `[1, 2, 3]` | Listas, coleções |
| **object** | `{"a": 1}` | Dados estruturados |
| **null** | `null` | Valores ausentes |

## Atualizações Incrementais

Uma característica poderosa de A2UI é a capacidade de fazer **atualizações incrementais**. Você não precisa ressintonizar todo o JSON.

### Exemplo
Inicialmente:
```json
{
  "createSurface": {"surfaceId": "main"},
  "updateComponents": [
    {"id": "card-1", "type": "card", "properties": {"title": "Opção 1"}},
    {"id": "card-2", "type": "card", "properties": {"title": "Opção 2"}}
  ]
}
```

Depois de algum tempo, apenas adicione:
```json
{
  "updateComponents": {
    "surfaceId": "main",
    "components": [
      {"id": "card-3", "type": "card", "properties": {"title": "Opção 3"}}
    ]
  }
}
```

O renderizador adiciona apenas o novo componente, não re-renderiza tudo.

## Validação

O A2UI define um processo de validação em camadas:

### 1. Validação de Esquema
O JSON deve estar bem formado e corresponder ao esquema A2UI.

### 2. Validação de Catálogo
Os componentes e funções referenciados devem existir no catálogo.

### 3. Validação de Referências
Os IDs de componentes e caminhos de dados devem ser válidos.

## Segurança e Isolamento

### Princípios
- **Sem Execução de Código**: Apenas dados declarativos
- **Catálogo Branco**: Apenas componentes pré-aprovados
- **Isolamento de Superfícies**: Cada superfície é isolada
- **Validação Rigorosa**: Cada mensagem é validada antes de processar

## Próximas Etapas

- 📖 Leia [Arquitetura](arquitetura.md) para entender como tudo funciona junto
- 🔍 Explore [Protocolo v1.0](../documentacao/protocolo-v1.0.md) para detalhes técnicos
- 💻 Comece a implementar com o [Guia de Implementação](../documentacao/guia-implementacao.md)

---

Está confuso sobre algum conceito? Abra uma [discussão](https://github.com/a2ui-project/a2ui/discussions) no GitHub!
