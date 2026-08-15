# Guia de Implementação de A2UI

Como implementar um renderizador e catálogo A2UI para sua plataforma.

## Visão Geral

Implementar A2UI envolve três componentes principais:

1. **Catálogo**: Definir quais componentes e funções estão disponíveis
2. **Renderizador**: Parser A2UI e mapeador para componentes nativos
3. **Transporte**: Enviar/receber mensagens entre agente e renderizador

## Passo 1: Definir o Catálogo

### Estrutura Base

```json
{
  "catalogs": {
    "default": {
      "components": {
        "button": {
          "description": "Um botão clicável",
          "properties": {
            "label": {
              "type": "string",
              "description": "Texto do botão"
            },
            "disabled": {
              "type": "boolean",
              "description": "Desabilitar botão"
            }
          }
        },
        "text": {
          "description": "Texto simples",
          "properties": {
            "content": {
              "type": "string"
            }
          }
        },
        "card": {
          "description": "Um cartão para agrupar conteúdo",
          "properties": {
            "title": {"type": "string"},
            "children": {"type": "array"}
          }
        }
      },
      "functions": {
        "validateEmail": {
          "description": "Valida um email",
          "parameters": {
            "email": {"type": "string"}
          },
          "returns": {"type": "boolean"}
        }
      }
    }
  }
}
```

### Exemplo Completo com Múltiplos Catálogos

```json
{
  "catalogs": {
    "default": { ... },
    "advanced": {
      "components": {
        "datepicker": { ... },
        "chart": { ... }
      }
    }
  }
}
```

## Passo 2: Implementar Parser A2UI

### Pseudocódigo de Parser

```javascript
class A2UIParser {
  constructor(catalog) {
    this.catalog = catalog;
    this.surfaces = new Map();
    this.dataModels = new Map();
  }

  parse(message) {
    // Processar createSurface
    if (message.createSurface) {
      this.handleCreateSurface(message.createSurface);
    }

    // Processar updateComponents
    if (message.updateComponents) {
      this.handleUpdateComponents(message.updateComponents);
    }

    // Processar updateDataModel
    if (message.updateDataModel) {
      this.handleUpdateDataModel(message.updateDataModel);
    }

    // Processar deleteSurface
    if (message.deleteSurface) {
      this.handleDeleteSurface(message.deleteSurface);
    }
  }

  handleCreateSurface(data) {
    const { surfaceId, displayName, catalog } = data;
    
    // Validar catálogo existe
    if (!this.catalog.catalogs[catalog || 'default']) {
      throw new Error(`Catálogo não encontrado: ${catalog}`);
    }

    // Criar superfície
    this.surfaces.set(surfaceId, {
      displayName,
      catalog,
      components: new Map()
    });

    this.dataModels.set(surfaceId, {});
  }

  handleUpdateComponents(data) {
    const { surfaceId, components } = data;
    const surface = this.surfaces.get(surfaceId);
    
    if (!surface) {
      throw new Error(`Superfície não encontrada: ${surfaceId}`);
    }

    for (const component of components) {
      this.validateComponent(surface, component);
      surface.components.set(component.id, component);
    }
  }

  handleUpdateDataModel(data) {
    const { surfaceId, path, value } = data;
    const model = this.dataModels.get(surfaceId);
    
    if (!model) {
      throw new Error(`Modelo de dados não encontrado: ${surfaceId}`);
    }

    // Parse JSON Pointer
    this.setValueAtPath(model, path, value);
  }

  handleDeleteSurface(data) {
    const { surfaceId } = data;
    this.surfaces.delete(surfaceId);
    this.dataModels.delete(surfaceId);
  }

  validateComponent(surface, component) {
    const catalogDef = this.catalog.catalogs[surface.catalog];
    const componentDef = catalogDef.components[component.type];
    
    if (!componentDef) {
      throw new Error(`Componente não encontrado: ${component.type}`);
    }

    // Validar propriedades
    for (const [key, value] of Object.entries(component.properties || {})) {
      const propDef = componentDef.properties[key];
      if (!propDef) {
        console.warn(`Propriedade desconhecida: ${key}`);
      }
    }
  }

  setValueAtPath(obj, path, value) {
    const parts = path.split('/').filter(p => p);
    let current = obj;
    
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    
    current[parts[parts.length - 1]] = value;
  }
}
```

## Passo 3: Implementar Renderizador

### Exemplo em JavaScript/React

```javascript
class A2UIRenderer {
  constructor(catalog, componentMap) {
    this.parser = new A2UIParser(catalog);
    this.componentMap = componentMap; // Mapeamento de tipo -> React Component
  }

  render(surfaceId) {
    const surface = this.parser.surfaces.get(surfaceId);
    const dataModel = this.parser.dataModels.get(surfaceId);

    return this.renderComponents(
      surface,
      Array.from(surface.components.values()),
      dataModel
    );
  }

  renderComponents(surface, components, dataModel) {
    return components.map(component => 
      this.renderComponent(component, dataModel)
    );
  }

  renderComponent(component, dataModel) {
    const ComponentClass = this.componentMap[component.type];
    
    if (!ComponentClass) {
      throw new Error(`Componente não mapeado: ${component.type}`);
    }

    const props = this.resolveProperties(
      component.properties,
      dataModel
    );

    return <ComponentClass key={component.id} {...props} />;
  }

  resolveProperties(properties, dataModel) {
    const resolved = {};

    for (const [key, value] of Object.entries(properties || {})) {
      resolved[key] = this.resolveValue(value, dataModel);
    }

    return resolved;
  }

  resolveValue(value, dataModel) {
    if (typeof value === 'string' && value.startsWith('${')) {
      // Extrair caminho
      const path = value.slice(2, -1); // Remove ${ }
      return this.getValueFromModel(dataModel, path);
    }

    if (typeof value === 'object' && value !== null) {
      return this.resolveProperties(value, dataModel);
    }

    return value;
  }

  getValueFromModel(dataModel, path) {
    const parts = path.split('/').filter(p => p);
    let current = dataModel;

    for (const part of parts) {
      current = current[part];
      if (current === undefined) return null;
    }

    return current;
  }
}
```

### Exemplo em Flutter

```dart
class A2UIRenderer {
  final A2UIParser parser;
  final Map<String, WidgetBuilder> componentBuilders;

  A2UIRenderer({
    required this.parser,
    required this.componentBuilders,
  });

  Widget render(String surfaceId) {
    final surface = parser.surfaces[surfaceId];
    final dataModel = parser.dataModels[surfaceId];

    if (surface == null) {
      return Text('Superfície não encontrada');
    }

    final components = surface.components.values.toList();
    return Column(
      children: components
          .map((c) => renderComponent(c, dataModel))
          .toList(),
    );
  }

  Widget renderComponent(Component component, Map<String, dynamic> dataModel) {
    final builder = componentBuilders[component.type];

    if (builder == null) {
      return Text('Componente não mapeado: ${component.type}');
    }

    final props = resolveProperties(component.properties ?? {}, dataModel);

    return builder(props);
  }

  Map<String, dynamic> resolveProperties(
    Map<String, dynamic> properties,
    Map<String, dynamic> dataModel,
  ) {
    final resolved = <String, dynamic>{};

    properties.forEach((key, value) {
      resolved[key] = resolveValue(value, dataModel);
    });

    return resolved;
  }

  dynamic resolveValue(dynamic value, Map<String, dynamic> dataModel) {
    if (value is String && value.startsWith('\${')) {
      final path = value.substring(2, value.length - 1);
      return getValueFromModel(dataModel, path);
    }

    if (value is Map) {
      return resolveProperties(value.cast(), dataModel);
    }

    return value;
  }

  dynamic getValueFromModel(Map<String, dynamic> dataModel, String path) {
    final parts = path.split('/').where((p) => p.isNotEmpty).toList();
    dynamic current = dataModel;

    for (final part in parts) {
      if (current is Map) {
        current = current[part];
      } else if (current is List && int.tryParse(part) != null) {
        current = current[int.parse(part)];
      } else {
        return null;
      }

      if (current == null) return null;
    }

    return current;
  }
}
```

## Passo 4: Mapeamento de Componentes

### React

```javascript
const componentMap = {
  button: (props) => (
    <button 
      onClick={props.onClick}
      disabled={props.disabled}
    >
      {props.label}
    </button>
  ),
  
  text: (props) => (
    <p>{props.content}</p>
  ),
  
  card: (props) => (
    <div className="card">
      <h3>{props.title}</h3>
      {props.children}
    </div>
  ),
};
```

### Flutter

```dart
final componentBuilders = {
  'button': (props) {
    return ElevatedButton(
      onPressed: props['onClick'],
      child: Text(props['label']),
    );
  },
  
  'text': (props) {
    return Text(props['content']);
  },
  
  'card': (props) {
    return Card(
      child: Column(
        children: [
          Text(props['title']),
          ...(props['children'] as List<Widget>? ?? []),
        ],
      ),
    );
  },
};
```

## Passo 5: Implementar Transporte

### WebSocket Simples

```javascript
class A2UIWebSocketTransport {
  constructor(url, onMessage) {
    this.ws = new WebSocket(url);
    this.onMessage = onMessage;

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.onMessage(message);
      } catch (e) {
        console.error('Erro ao parsear mensagem:', e);
      }
    };
  }

  send(message) {
    this.ws.send(JSON.stringify(message));
  }
}
```

### Uso

```javascript
const transport = new A2UIWebSocketTransport(
  'ws://localhost:8000',
  (message) => {
    parser.parse(message);
    renderer.render('main');
  }
);

// Enviar ação
transport.send({
  action: {
    name: 'click',
    context: { componentId: 'button-1' }
  }
});
```

## Passo 6: Testes

### Teste de Parser

```javascript
describe('A2UIParser', () => {
  let parser;

  beforeEach(() => {
    parser = new A2UIParser(mockCatalog);
  });

  test('createSurface cria superfície', () => {
    parser.parse({
      createSurface: {
        surfaceId: 'test',
        displayName: 'Test Surface'
      }
    });

    expect(parser.surfaces.has('test')).toBe(true);
  });

  test('updateComponents valida contra catálogo', () => {
    parser.parse({
      createSurface: { surfaceId: 'test' }
    });

    expect(() => {
      parser.parse({
        updateComponents: {
          surfaceId: 'test',
          components: [{
            id: 'btn',
            type: 'invalid-type'
          }]
        }
      });
    }).toThrow();
  });
});
```

## Checklist de Implementação

- [ ] Catálogo definido com componentes básicos
- [ ] Parser A2UI implementado
- [ ] Renderizador implementado
- [ ] Componentes mapeados para UI nativa
- [ ] Suporte a ligação de dados
- [ ] Transporte implementado
- [ ] Tratamento de erros
- [ ] Testes escritos
- [ ] Documentação atualizada

## Recursos Adicionais

- 📖 [Protocolo v1.0](protocolo-v1.0.md)
- 🔧 [Funções Personalizadas](funcoes-personalizadas.md)
- 💻 [Exemplos de Código](../referencia/exemplos.md)
- 🚀 [Demonstrações](https://a2ui-composer.ag-ui.com/theater)

---

Tem dúvidas sobre implementação? Abra uma [issue](https://github.com/a2ui-project/a2ui/issues) ou [discussão](https://github.com/a2ui-project/a2ui/discussions)!
