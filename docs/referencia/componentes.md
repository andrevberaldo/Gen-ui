# Referência de Componentes A2UI

Documentação dos componentes padrão disponíveis em A2UI.

## Componentes Básicos

### text
Renderiza texto simples.

**Propriedades**:
- `content` (string): Conteúdo do texto
- `style` (string): Estilo (heading, body, caption, etc.)

**Exemplo**:
```json
{
  "id": "greeting",
  "type": "text",
  "properties": {
    "content": "Olá, mundo!",
    "style": "heading"
  }
}
```

### button
Um botão clicável.

**Propriedades**:
- `label` (string): Texto do botão
- `disabled` (boolean): Desabilitar botão
- `onPress` (action): Ação ao clicar
- `variant` (string): Estilo (primary, secondary, outline)

**Exemplo**:
```json
{
  "id": "submit",
  "type": "button",
  "properties": {
    "label": "Enviar",
    "variant": "primary",
    "onPress": {
      "name": "submit",
      "context": {"formId": "main"}
    }
  }
}
```

### card
Um cartão para agrupar conteúdo.

**Propriedades**:
- `title` (string): Título do cartão
- `subtitle` (string): Subtítulo
- `children` (array): Componentes filhos

**Exemplo**:
```json
{
  "id": "user-card",
  "type": "card",
  "properties": {
    "title": "Perfil de Usuário",
    "subtitle": "João Silva"
  }
}
```

## Componentes de Entrada

### text-input
Campo de entrada de texto.

**Propriedades**:
- `label` (string): Label do campo
- `placeholder` (string): Placeholder
- `value` (string): Valor atual
- `disabled` (boolean): Desabilitar campo
- `onChange` (action): Ao mudar valor

**Exemplo**:
```json
{
  "id": "name-input",
  "type": "text-input",
  "properties": {
    "label": "Nome",
    "placeholder": "Digite seu nome",
    "onChange": {
      "name": "updateField",
      "context": {"field": "name"}
    }
  }
}
```

### checkbox
Caixa de seleção.

**Propriedades**:
- `label` (string): Label
- `checked` (boolean): Marcado ou não
- `onChange` (action): Ao mudar estado

**Exemplo**:
```json
{
  "id": "terms-check",
  "type": "checkbox",
  "properties": {
    "label": "Aceito os termos e condições",
    "onChange": {
      "name": "toggleTerms"
    }
  }
}
```

### select
Campo de seleção/dropdown.

**Propriedades**:
- `label` (string): Label
- `options` (array): Lista de opções
- `value` (string): Valor selecionado
- `onChange` (action): Ao mudar seleção

**Exemplo**:
```json
{
  "id": "country-select",
  "type": "select",
  "properties": {
    "label": "País",
    "options": [
      {"value": "br", "label": "Brasil"},
      {"value": "pt", "label": "Portugal"}
    ],
    "onChange": {
      "name": "selectCountry"
    }
  }
}
```

## Componentes de Apresentação

### list
Uma lista de itens.

**Propriedades**:
- `items` (array): Array de dados
- `itemTemplate` (component): Template para cada item
- `onItemPress` (action): Ao clicar em item

**Exemplo**:
```json
{
  "id": "restaurants",
  "type": "list",
  "properties": {
    "items": "${/restaurantList}",
    "itemTemplate": {
      "type": "card",
      "properties": {
        "title": "${@item/name}",
        "subtitle": "${@item/rating} ⭐"
      }
    }
  }
}
```

### table
Tabela de dados.

**Propriedades**:
- `columns` (array): Definição de colunas
- `rows` (array): Dados das linhas
- `sortable` (boolean): Permitir ordenação

**Exemplo**:
```json
{
  "id": "data-table",
  "type": "table",
  "properties": {
    "columns": [
      {"key": "name", "label": "Nome"},
      {"key": "email", "label": "Email"}
    ],
    "rows": "${/dataRows}"
  }
}
```

### divider
Divisor/linha de separação.

**Propriedades**:
- `orientation` (string): horizontal ou vertical

**Exemplo**:
```json
{
  "id": "sep",
  "type": "divider",
  "properties": {
    "orientation": "horizontal"
  }
}
```

## Componentes de Layout

### container
Contêiner genérico para agrupar componentes.

**Propriedades**:
- `layout` (string): row, column, grid
- `spacing` (number): Espaço entre filhos
- `children` (array): Componentes filhos

**Exemplo**:
```json
{
  "id": "form",
  "type": "container",
  "properties": {
    "layout": "column",
    "spacing": 16,
    "children": [
      {
        "id": "name",
        "type": "text-input"
      },
      {
        "id": "email",
        "type": "text-input"
      }
    ]
  }
}
```

### scroll
Área rolável.

**Propriedades**:
- `direction` (string): vertical ou horizontal
- `children` (array): Componentes filhos

**Exemplo**:
```json
{
  "id": "scrollable",
  "type": "scroll",
  "properties": {
    "direction": "vertical",
    "children": [...]
  }
}
```

## Componentes de Feedback

### loading
Indicador de carregamento.

**Propriedades**:
- `message` (string): Mensagem de carregamento
- `size` (string): Tamanho (small, medium, large)

**Exemplo**:
```json
{
  "id": "loader",
  "type": "loading",
  "properties": {
    "message": "Carregando...",
    "size": "medium"
  }
}
```

### alert
Alerta ou notificação.

**Propriedades**:
- `title` (string): Título
- `message` (string): Mensagem
- `type` (string): info, warning, error, success
- `onClose` (action): Ao fechar

**Exemplo**:
```json
{
  "id": "success-alert",
  "type": "alert",
  "properties": {
    "title": "Sucesso!",
    "message": "Operação concluída",
    "type": "success"
  }
}
```

### progress
Barra de progresso.

**Propriedades**:
- `value` (number): Valor de 0 a 100
- `label` (string): Label opcional

**Exemplo**:
```json
{
  "id": "upload-progress",
  "type": "progress",
  "properties": {
    "value": 65,
    "label": "Enviando..."
  }
}
```

## Componentes Avançados

### form
Formulário com múltiplos campos.

**Propriedades**:
- `fields` (array): Definição de campos
- `onSubmit` (action): Ao enviar
- `validation` (object): Regras de validação

**Exemplo**:
```json
{
  "id": "contact-form",
  "type": "form",
  "properties": {
    "fields": [
      {
        "id": "name",
        "type": "text-input",
        "label": "Nome"
      },
      {
        "id": "email",
        "type": "text-input",
        "label": "Email"
      }
    ],
    "onSubmit": {
      "name": "submitForm"
    }
  }
}
```

### modal
Modal/diálogo.

**Propriedades**:
- `title` (string): Título do modal
- `children` (array): Conteúdo
- `onClose` (action): Ao fechar
- `actions` (array): Botões de ação

**Exemplo**:
```json
{
  "id": "confirm-modal",
  "type": "modal",
  "properties": {
    "title": "Confirmar Ação",
    "children": [
      {
        "type": "text",
        "properties": {
          "content": "Tem certeza?"
        }
      }
    ],
    "actions": [
      {
        "label": "Cancelar",
        "onPress": {"name": "cancel"}
      },
      {
        "label": "Confirmar",
        "onPress": {"name": "confirm"}
      }
    ]
  }
}
```

### chart
Gráfico/visualização de dados.

**Propriedades**:
- `type` (string): bar, line, pie, etc.
- `data` (array): Dados a visualizar
- `options` (object): Opções de gráfico

**Exemplo**:
```json
{
  "id": "revenue-chart",
  "type": "chart",
  "properties": {
    "type": "bar",
    "data": "${/chartData}",
    "options": {
      "title": "Receita Mensal"
    }
  }
}
```

## Propriedades Comuns

Todas as propriedades abaixo são suportadas por todos os componentes:

- `id` (string): Identificador único
- `type` (string): Tipo do componente
- `visible` (boolean): Visibilidade
- `disabled` (boolean): Desabilitar
- `className` (string): Classe CSS customizada
- `testId` (string): ID para testes

## Variantes de Estilo

Muitos componentes suportam propriedade `variant`:

- **button**: primary, secondary, outline, ghost
- **text**: heading, subheading, body, caption
- **alert**: info, warning, error, success
- **card**: elevated, outlined, filled

## Ligação de Dados

Qualquer propriedade pode usar ligação de dados:

```json
{
  "id": "greeting",
  "type": "text",
  "properties": {
    "content": "Olá, ${/user/name}!"
  }
}
```

## Contexto em Listas

Dentro de `itemTemplate`:

```json
{
  "id": "list",
  "type": "list",
  "properties": {
    "items": "${/items}",
    "itemTemplate": {
      "type": "text",
      "properties": {
        // @item = item atual
        // @index = índice
        // @parent = contexto pai
        "content": "${@index}: ${@item/name}"
      }
    }
  }
}
```

## Recursos Adicionais

- 📖 [Protocolo Completo](../documentacao/protocolo-v1.0.md)
- 🛠️ [Guia de Implementação](../documentacao/guia-implementacao.md)
- 💻 [Exemplos de Código](exemplos.md)

---

Faltando algum componente? Abra uma [discussão](https://github.com/a2ui-project/a2ui/discussions)!
