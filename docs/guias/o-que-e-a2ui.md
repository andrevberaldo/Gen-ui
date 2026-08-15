# O que é A2UI? - Visão Geral Completa

## Definição

**A2UI (Agent-to-User Interface)** é um protocolo declarativo e um conjunto de bibliotecas de código aberto que permite que agentes de IA gerem interfaces de usuário ricas, interativas e seguras através de um formato JSON padronizado.

Em vez de gerar código HTML/CSS/JavaScript (que é arriscado e específico de framework), agentes enviam um JSON estruturado descrevendo "o que a UI deveria fazer". O lado do cliente (seu aplicativo) renderiza isso usando seus próprios componentes nativos.

## Analogia Simples

Pense em A2UI como um **menu de restaurante**:

- **Sem A2UI**: O chef te diz "pegue as receitas escritas em JavaScript" (execução arbitrária)
- **Com A2UI**: O chef te passa um cardápio com itens pré-aprovados (JSON declarativo) - você escolhe o que cozinhar com suas receitas confiáveis

## Componentes Chave

### 1. Catálogo de Componentes
Lista de componentes pré-aprovados que um agente pode solicitar renderizar.

**Exemplos**: Botão, Campo de Texto, Cartão, Lista, Tabela, Gráfico

Você controla completamente quais componentes estão disponíveis e seu comportamento.

### 2. Payload A2UI (JSON)
Mensagem que o agente envia descrevendo a UI desejada:

```json
{
  "createSurface": {
    "surfaceId": "restaurant-results",
    "displayName": "Restaurantes Encontrados"
  },
  "updateComponents": [
    {
      "id": "card-1",
      "type": "card",
      "properties": {
        "title": "Pizzaria da Zona",
        "description": "4.5 ⭐ • 2km de distância",
        "image": "https://..."
      }
    }
  ],
  "updateDataModel": {
    "path": "/restaurants",
    "value": [...]
  }
}
```

### 3. Renderizador A2UI
Seu aplicativo cliente que recebe o JSON e o converte em UI renderizada nativa.

**Implementações Disponíveis**:
- 🎨 **Web**: Lit, React, Angular
- 📱 **Mobile**: Flutter, SwiftUI (em desenvolvimento)
- 💻 **Desktop**: Electron, etc.

### 4. Agente (IA)
Sistema que gera payloads A2UI. Tipicamente um LLM (Gemini, Claude, etc.) com acesso a um catálogo de componentes.

## Como A2UI Funciona

### Fluxo Básico

```
1. Usuário: "Encontre restaurantes perto de mim"
   ↓
2. Agente (LLM) entende a solicitação
   ↓
3. Agente gera payload A2UI:
   {
     "createSurface": {...},
     "updateComponents": [...]
   }
   ↓
4. Renderizador recebe JSON
   ↓
5. Renderizador mapeia para componentes nativos
   ↓
6. UI Renderizada aparece na tela
   ↓
7. Usuário interage (clica, preenche formulário)
   ↓
8. Evento é enviado de volta ao agente
   ↓
9. Agente responde com mudanças A2UI (updateComponents, updateDataModel)
   ↓
10. Renderizador atualiza a UI (sem recarregar página)
```

### Tipos de Mensagens A2UI

O protocolo define 4 tipos principais de mensagens:

#### `createSurface`
Sinaliza ao renderizador criar uma nova superfície de UI.

```json
{
  "createSurface": {
    "surfaceId": "main",
    "displayName": "Interface Principal"
  }
}
```

#### `updateComponents`
Adiciona ou atualiza componentes em uma superfície.

```json
{
  "updateComponents": {
    "surfaceId": "main",
    "components": [
      {
        "id": "button-1",
        "type": "button",
        "properties": {
          "label": "Enviar",
          "enabled": true
        }
      }
    ]
  }
}
```

#### `updateDataModel`
Fornece dados para preenchimento dinâmico de componentes.

```json
{
  "updateDataModel": {
    "surfaceId": "main",
    "path": "/user/name",
    "value": "João Silva"
  }
}
```

#### `deleteSurface`
Remove uma superfície e seu conteúdo da UI.

```json
{
  "deleteSurface": {
    "surfaceId": "main"
  }
}
```

## Características Principais

### ✅ Seguro
- Formato declarativo apenas - sem execução arbitrária de código
- Agentes limitados ao catálogo aprovado
- Você controla tudo que pode ser renderizado

### ✅ Eficiente
- Atualizações incrementais (apenas enviar mudanças)
- Renderização progressiva (UI aparece enquanto é construída)
- Perfeito para streaming de respostas de LLM

### ✅ Portável
- Mesmo payload funciona em múltiplas plataformas
- Web, Mobile, Desktop - sem duplicação de código
- Framework-agnóstico

### ✅ Amigável para LLM
- Estrutura simples e intuitiva para modelos gerarem
- Suporte para tipos de dados complexos
- Ligação de dados integrada

## Exemplo Prático

### Cenário: App de Busca de Restaurantes

**Usuário pergunta**: "Encontre restaurantes indianos abertos agora perto de mim"

**Agente gera isso**:

```json
{
  "createSurface": {
    "surfaceId": "restaurants",
    "displayName": "Restaurantes Encontrados"
  },
  "updateComponents": {
    "surfaceId": "restaurants",
    "components": [
      {
        "id": "title",
        "type": "text",
        "properties": {
          "content": "3 restaurantes encontrados",
          "style": "heading"
        }
      },
      {
        "id": "list",
        "type": "list",
        "properties": {
          "items": ["taj-1", "curry-2", "namaste-3"]
        }
      },
      {
        "id": "taj-1",
        "type": "card",
        "properties": {
          "title": "Taj Mahal",
          "subtitle": "4.8 ⭐ • Aberto até 23h",
          "action": {
            "name": "reserve",
            "context": {"restaurantId": "taj-1"}
          }
        }
      }
      // ... mais restaurantes
    ]
  }
}
```

**Renderizador recebe isso e mostra**:

```
┌─────────────────────────────┐
│  Restaurantes Encontrados   │
├─────────────────────────────┤
│ 3 restaurantes encontrados  │
│                             │
│ ┌───────────────────────┐   │
│ │ Taj Mahal             │   │
│ │ 4.8 ⭐ • Aberto até 23│   │
│ │ [Reservar]            │   │
│ └───────────────────────┘   │
│ ┌───────────────────────┐   │
│ │ Curry House           │   │
│ │ 4.5 ⭐ • Aberto até 22│   │
│ │ [Reservar]            │   │
│ └───────────────────────┘   │
│                             │
└─────────────────────────────┘
```

**Usuário clica** "Reservar" no Taj Mahal

**Renderizador envia de volta**:
```json
{
  "action": {
    "name": "reserve",
    "context": {"restaurantId": "taj-1"}
  }
}
```

**Agente recebe isso e envia**:
```json
{
  "updateComponents": {
    "surfaceId": "restaurants",
    "components": [
      {
        "id": "confirmation",
        "type": "card",
        "properties": {
          "title": "Reserva Confirmada! ✓",
          "content": "Mesa reservada para 2 pessoas às 19h30"
        }
      }
    ]
  }
}
```

## Ecossistema

### LLMs Suportados
- Google Gemini
- Anthropic Claude
- OpenAI GPT
- E qualquer modelo que possa gerar JSON

### Transporte
- A2A (Agent-to-Agent)
- AG-UI
- MCP (Model Context Protocol)
- WebSocket personalizado

### Implementações de Renderizador
- **Web**: [Lit](https://lit.dev), React, Angular
- **Mobile**: [Flutter GenUI SDK](https://github.com/flutter/genui)
- **Desktop**: Electron, SwiftUI (em desenvolvimento)

## Comparação com Alternativas

| Aspecto | A2UI | HTML Gerado | Componentes Personalizados |
|--------|------|-------------|--------------------------|
| **Segurança** | ✅ Declarativo | ❌ Código executável | ⚠️ Depende da implementação |
| **Performance** | ✅ Atualizações incrementais | ❌ Re-renderização completa | ✅ Bom |
| **Portabilidade** | ✅ Framework-agnóstico | ❌ HTML específico | ❌ Platform-específico |
| **Facilidade para LLM** | ✅ Estrutura clara | ⚠️ HTML complexo | ⚠️ APIs customizadas |
| **Controle** | ✅ Total | ❌ Limitado | ✅ Total |

## Próximas Etapas

- 📖 Leia [Conceitos Principais](conceitos-principais.md) para entender melhor
- 🚀 Comece com o [Guia de Início Rápido](../quickstart.md)
- 📚 Explore a [Especificação Completa](../documentacao/protocolo-v1.0.md)
- 💬 Junte-se à comunidade no [GitHub](https://github.com/a2ui-project/a2ui)

---

**Tem perguntas?** Veja [Discussões](https://github.com/a2ui-project/a2ui/discussions) ou abra uma [issue](https://github.com/a2ui-project/a2ui/issues).
