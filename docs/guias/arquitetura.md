# Arquitetura de A2UI

Uma visão profunda de como os componentes de A2UI trabalham juntos.

## Visão Geral da Arquitetura

```
┌──────────────────────────────────────────────────────────────┐
│                    CAMADA DE APLICAÇÃO                       │
│  (Seu aplicativo - chat, app, dashboard, etc.)              │
└──────────────────┬───────────────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────────────┐
│                  CAMADA A2UI (PROTOCOLO)                     │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ createSurface, updateComponents, updateDataModel, ...   │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────┬───────────────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────────────┐
│                  CAMADA DE TRANSPORTE                        │
│  (A2A, AG-UI, MCP, WebSocket, etc.)                         │
└──────────────────┬───────────────────────────────────────────┘
                   │
     ┌─────────────┴─────────────┐
     │                           │
┌────▼────────────────┐   ┌──────▼──────────────────┐
│   LADO DO AGENTE    │   │   LADO DO CLIENTE      │
│  ┌────────────────┐ │   │  ┌──────────────────┐  │
│  │  LLM (Gemini)  │ │   │  │  Renderizador    │  │
│  │  JSON Generator│ │   │  │  (Flutter, Web)  │  │
│  └────────────────┘ │   │  └──────────────────┘  │
└─────────────────────┘   └──────────────────────┘
```

## Componentes da Arquitetura

### 1. Protocolo A2UI (Transport-Agnostic)

O núcleo de A2UI define:

#### Mensagens do Agente → Renderizador
- **createSurface**: Cria uma nova superfície de UI
- **updateComponents**: Adiciona/atualiza componentes
- **updateDataModel**: Modifica dados
- **deleteSurface**: Remove uma superfície

#### Mensagens do Renderizador → Agente
- **action**: Resposta do usuário a interações
- **callAgentFunction**: Executa função no agente
- **rendererFunctionResponse**: Resposta de função executada

### 2. Camada de Transporte

O transporte é responsável por:

#### Contrato de Transporte
1. **Entrega Confiável**: Mensagens entregues na ordem correta
2. **Delimitação de Mensagens**: Cada mensagem claramente demarcada
3. **Suporte a Metadados**: Associar metadados às mensagens
4. **Bidirecionalidade**: Agente → Renderizador (principal), Renderizador → Agente (retorno)

#### Implementações de Transporte

##### A2A (Agent-to-Agent)
Protocolo específico para comunicação entre agentes:
```
Agente → A2A Transport → Renderizador
Renderizador → A2A Transport → Agente
```

##### AG-UI
Abstração para integrações com frameworks como Google Chat, LangGraph, CrewAI:
```
Agente → AG-UI → A2UI JSON → Renderizador
```

##### MCP (Model Context Protocol)
Permite A2UI sobre MCP:
```
Agente → MCP → A2UI JSON → Renderizador
```

### 3. Lado do Agente

#### Responsabilidades
1. **Entender Solicitações**: Processar entrada do usuário
2. **Gerar A2UI**: Criar payloads JSON válidos
3. **Manter Estado**: Rastrear o estado da conversa
4. **Responder a Ações**: Processar eventos do usuário

#### Fluxo
```
┌─────────────────┐
│  Entrada do     │
│  Usuário        │
└────────┬────────┘
         │
    ┌────▼─────────────┐
    │  LLM Processa    │
    │  (com contexto)  │
    └────┬─────────────┘
         │
    ┌────▼──────────────────┐
    │  Gera A2UI JSON        │
    │  (validate contra cat.)│
    └────┬──────────────────┘
         │
    ┌────▼──────────────┐
    │  Envia via         │
    │  Transporte       │
    └───────────────────┘
```

#### Catálogo do Lado do Agente
O agente recebe um catálogo que define:
- Quais componentes pode usar
- Quais funções pode chamar
- Que propriedades cada componente suporta

### 4. Lado do Renderizador

#### Responsabilidades
1. **Receber Mensagens**: Consumir stream A2UI
2. **Validar**: Verificar contra catálogo
3. **Renderizar**: Mapear para UI nativa
4. **Gerenciar Estado**: Manter árvore de UI e modelo de dados
5. **Enviar Ações**: Comunicar interações do usuário

#### Fluxo
```
┌──────────────────┐
│  Recebe A2UI     │
│  JSON do Agente  │
└────────┬─────────┘
         │
    ┌────▼────────────────┐
    │  Valida contra      │
    │  Catálogo Local     │
    └────┬────────────────┘
         │
    ┌────▼──────────────┐
    │  Atualiza Estado  │
    │  (árvore UI +     │
    │   dados)          │
    └────┬──────────────┘
         │
    ┌────▼──────────────────┐
    │  Mapeia para           │
    │  Componentes Nativos   │
    │  (Flutter, React, etc.)│
    └────┬──────────────────┘
         │
    ┌────▼──────────┐
    │  Renderiza    │
    │  UI Nativa    │
    └────┬──────────┘
         │
    ┌────▼──────────────┐
    │  Usuário Interage │
    │  (clica, digita)  │
    └────┬──────────────┘
         │
    ┌────▼──────────┐
    │  Envia Ação   │
    │  ao Agente    │
    └───────────────┘
```

### 5. Catálogo

O catálogo é o "contrato" entre agente e renderizador.

#### Estrutura
```json
{
  "catalogs": {
    "default": {
      "components": {
        "button": {
          "description": "...",
          "properties": {
            "label": {"type": "string"},
            "disabled": {"type": "boolean"},
            "onPress": {"type": "action"}
          }
        }
      },
      "functions": {
        "validateEmail": {
          "description": "...",
          "parameters": {
            "email": {"type": "string"}
          }
        }
      }
    }
  }
}
```

#### Papel do Catálogo
- **Validação**: Garante que apenas componentes conhecidos sejam usados
- **Segurança**: Define o limite do que é permitido
- **Documentação**: LLMs entendem o que está disponível
- **Type Checking**: Validação de tipos em tempo de compilação

## Fluxo Completo: Exemplo

### Cenário: Busca de Restaurantes

#### 1. Usuário digita
```
"Encontre restaurantes indianos perto de mim"
```

#### 2. Agente processa
- Envia a entrada pelo LLM com o catálogo
- LLM gera este JSON:

```json
{
  "createSurface": {
    "surfaceId": "restaurant-search",
    "displayName": "Restaurantes Indianos"
  },
  "updateComponents": {
    "surfaceId": "restaurant-search",
    "components": [
      {
        "id": "loading-indicator",
        "type": "loading",
        "properties": {"message": "Buscando..."}
      }
    ]
  },
  "updateDataModel": {
    "surfaceId": "restaurant-search",
    "path": "/query",
    "value": "Restaurantes indianos perto de mim"
  }
}
```

#### 3. Transporte entrega
A mensagem é enviada via A2A, AG-UI, MCP, ou outro transporte.

#### 4. Renderizador recebe
```
✓ Valida contra catálogo
✓ Atualiza estado interno
✓ Renderiza loading spinner
```

#### 5. Agente busca resultados
Agente chama uma função para buscar restaurantes:
```json
{
  "callAgentFunction": {
    "functionName": "searchRestaurants",
    "parameters": {
      "cuisine": "Indianos",
      "location": "São Paulo"
    }
  }
}
```

#### 6. Agente recebe resultados
```
[
  {"id": 1, "name": "Taj Mahal", "rating": 4.8, "distance": 1.2},
  {"id": 2, "name": "Curry House", "rating": 4.5, "distance": 2.1},
  {"id": 3, "name": "Namaste", "rating": 4.7, "distance": 1.8}
]
```

#### 7. Agente atualiza UI
```json
{
  "updateDataModel": {
    "surfaceId": "restaurant-search",
    "path": "/restaurants",
    "value": [...]
  },
  "updateComponents": {
    "surfaceId": "restaurant-search",
    "components": [
      {
        "id": "results-list",
        "type": "list",
        "properties": {
          "items": ["${/restaurants}"],
          "itemTemplate": {
            "type": "card",
            "properties": {
              "title": "${@item/name}",
              "subtitle": "${@item/rating} ⭐ • ${@item/distance}km",
              "onPress": {
                "name": "selectRestaurant",
                "context": {"restaurantId": "${@item/id}"}
              }
            }
          }
        }
      }
    ]
  }
}
```

#### 8. Renderizador atualiza
```
✓ Remove loading spinner
✓ Renderiza lista de restaurantes
✓ Cada item é um card interativo
```

#### 9. Usuário clica em "Taj Mahal"

#### 10. Renderizador envia ação
```json
{
  "action": {
    "name": "selectRestaurant",
    "context": {"restaurantId": 1}
  }
}
```

#### 11. Agente responde
```json
{
  "updateComponents": {
    "surfaceId": "restaurant-search",
    "components": [
      {
        "id": "booking-form",
        "type": "form",
        "properties": {
          "title": "Taj Mahal - Fazer Reserva",
          "fields": [...]
        }
      }
    ]
  }
}
```

#### 12. Renderizador atualiza UI
Formulário de reserva aparece.

## Padrões de Projeto

### Renderização Progressiva
Agentes enviam componentes incrementalmente enquanto processam:
```
t=0:   createSurface
t=100: updateComponents (loading)
t=500: updateDataModel (resultados começam a aparecer)
t=1000: updateComponents (mais resultados)
t=1500: updateComponents (interface completa)
```

### Atualizações Incrementais
Apenas mudanças são enviadas:
```
Inicial: 100 componentes
Depois:  Enviar apenas 5 componentes novos (não todos os 105)
```

### Lazy Loading
Componentes podem solicitar dados sob demanda:
```
Renderizador vê: <list items="${/restaurants/page-2}">
Envia ação: loadMore
Agente carrega página 2 e envia updateDataModel
```

## Considerações de Desempenho

### Otimizações
1. **Batch Mensagens**: Agrupar múltiplas atualizações em uma
2. **Compressão**: Enviar apenas diffs de estado
3. **Lazy Loading**: Carregar dados conforme necessário
4. **Virtualização**: Renderizadores podem virtualizar listas grandes

### Métricas
- **Latência**: Tempo da entrada do usuário até UI renderizada
- **Throughput**: Mensagens por segundo
- **Memória**: Tamanho do estado da UI

## Segurança na Arquitetura

### Camadas de Segurança
1. **Nível de Protocolo**: Apenas tipos JSON válidos
2. **Nível de Catálogo**: Apenas componentes pré-aprovados
3. **Nível de Renderizador**: Validação rigorosa antes de renderizar
4. **Nível de Aplicação**: Lógica de segurança customizada

### Isolamento
- Cada superfície é isolada
- Sem acesso cross-surface
- Sem execução de código arbitrário
- Dados validados em cada passagem

## Próximas Etapas

- 📖 [Protocolo Completo](../documentacao/protocolo-v1.0.md)
- 🛠️ [Guia de Implementação](../documentacao/guia-implementacao.md)
- 💻 [Exemplos de Código](../referencia/exemplos.md)

---

Tem perguntas sobre a arquitetura? Abra uma [discussão](https://github.com/a2ui-project/a2ui/discussions)!
