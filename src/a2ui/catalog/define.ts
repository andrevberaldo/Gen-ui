/**
 * A tiny catalog description language.
 *
 * A2UI clients publish a *catalog*: the closed set of components an agent is
 * allowed to compose. Here the catalog is declared once, in TypeScript, and two
 * artifacts are derived from that single source of truth:
 *
 *   1. `buildCatalogDocument()` — the JSON Schema style document handed to the
 *      model, so it can only ever ask for components the design system has.
 *   2. `validateComponent()` — the runtime gate that rejects anything the model
 *      produces that does not match, before it reaches the renderer.
 *
 * Keeping both on one declaration is what makes "the agent decides what to
 * render" safe: the decision space *is* the design system.
 */

export type PropSpec =
  | {
      kind: 'string';
      description: string;
      /** Allowed values. Present for design-system variants (tone, size, ...). */
      values?: readonly string[];
      /** May be a `{path}` binding or a function call instead of a literal. */
      dynamic?: boolean;
      default?: string;
    }
  | { kind: 'number'; description: string; dynamic?: boolean; default?: number }
  | { kind: 'boolean'; description: string; dynamic?: boolean; default?: boolean }
  /** Two-way bound value: must be a `{path}` so the renderer can write back. */
  | { kind: 'binding'; description: string }
  | { kind: 'child'; description: string }
  | { kind: 'childList'; description: string }
  | { kind: 'action'; description: string }
  | { kind: 'checks'; description: string };

export interface ComponentSpec {
  description: string;
  props: Record<string, PropSpec>;
  required?: readonly string[];
}

export interface FunctionSpec {
  description: string;
  args: Record<string, { description: string; required?: boolean }>;
  returnType: 'string' | 'boolean' | 'void' | 'validationResult';
}

export interface CatalogDefinition {
  catalogId: string;
  title: string;
  description: string;
  /** Prose rules appended to the agent's system prompt. */
  instructions: string;
  components: Record<string, ComponentSpec>;
  functions: Record<string, FunctionSpec>;
}

/* -------------------------------------------------------------------------- */
/* Prop helpers                                                               */
/* -------------------------------------------------------------------------- */

export const str = (description: string, opts: { dynamic?: boolean } = {}): PropSpec => ({
  kind: 'string',
  description,
  dynamic: opts.dynamic ?? true,
});

export const variant = (
  description: string,
  values: readonly string[],
  defaultValue?: string,
): PropSpec => ({ kind: 'string', description, values, dynamic: false, default: defaultValue });

export const num = (description: string, opts: { dynamic?: boolean } = {}): PropSpec => ({
  kind: 'number',
  description,
  dynamic: opts.dynamic ?? true,
});

export const bool = (description: string, opts: { dynamic?: boolean } = {}): PropSpec => ({
  kind: 'boolean',
  description,
  dynamic: opts.dynamic ?? true,
});

export const binding = (description: string): PropSpec => ({ kind: 'binding', description });
export const child = (description: string): PropSpec => ({ kind: 'child', description });
export const childList = (description: string): PropSpec => ({ kind: 'childList', description });
export const action = (description: string): PropSpec => ({ kind: 'action', description });
export const checks = (description: string): PropSpec => ({ kind: 'checks', description });

/* -------------------------------------------------------------------------- */
/* JSON Schema emission (what the model sees)                                 */
/* -------------------------------------------------------------------------- */

const DATA_BINDING_REF = { $ref: '#/$defs/DataBinding' } as const;
const FUNCTION_CALL_REF = { $ref: '#/$defs/FunctionCall' } as const;

const DATA_BINDING_SCHEMA = {
  type: 'object',
  description: 'A reactive read from the surface data model, e.g. {"path": "/repo/stars"}.',
  properties: { path: { type: 'string' } },
  required: ['path'],
  additionalProperties: false,
};

const FUNCTION_CALL_SCHEMA = {
  type: 'object',
  description: 'A call to a catalog function, e.g. {"call": "formatString", "args": {...}}.',
  properties: { call: { type: 'string' }, args: { type: 'object' } },
  required: ['call'],
  additionalProperties: false,
};

function propSchema(spec: PropSpec): Record<string, unknown> {
  switch (spec.kind) {
    case 'string':
    case 'number':
    case 'boolean': {
      const literal: Record<string, unknown> = { type: spec.kind };
      if (spec.kind === 'string' && spec.values) literal.enum = [...spec.values];
      const schema: Record<string, unknown> = spec.dynamic
        ? { oneOf: [literal, DATA_BINDING_REF, FUNCTION_CALL_REF] }
        : literal;
      schema.description = spec.description;
      if (spec.default !== undefined) schema.default = spec.default;
      return schema;
    }
    case 'binding':
      return {
        ...DATA_BINDING_REF,
        description: `${spec.description} Must be a {"path": ...} binding: the renderer writes user input straight back to that path.`,
      };
    case 'child':
      return { type: 'string', description: `${spec.description} (component id)` };
    case 'childList':
      return {
        description: spec.description,
        oneOf: [
          { type: 'array', items: { type: 'string' }, description: 'Static list of component ids.' },
          {
            type: 'object',
            description: 'Template repeated once per item of an array in the data model.',
            properties: { componentId: { type: 'string' }, path: { type: 'string' } },
            required: ['componentId', 'path'],
            additionalProperties: false,
          },
        ],
      };
    case 'action':
      return {
        description: spec.description,
        oneOf: [
          {
            type: 'object',
            description: 'Dispatch an event to the agent.',
            properties: {
              event: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  userMessage: {
                    description: 'Shown in the transcript as what the user just did.',
                    oneOf: [{ type: 'string' }, DATA_BINDING_REF, FUNCTION_CALL_REF],
                  },
                  context: {
                    type: 'object',
                    description: 'Literals or {"path": ...} reads sent along with the event.',
                  },
                },
                required: ['name'],
                additionalProperties: false,
              },
            },
            required: ['event'],
            additionalProperties: false,
          },
          {
            type: 'object',
            description: 'Run a catalog function locally, without a round trip to the agent.',
            properties: { functionCall: FUNCTION_CALL_REF },
            required: ['functionCall'],
            additionalProperties: false,
          },
        ],
      };
    case 'checks':
      return {
        type: 'array',
        description: spec.description,
        items: {
          type: 'object',
          properties: {
            condition: FUNCTION_CALL_REF,
            message: { type: 'string' },
          },
          required: ['condition'],
          additionalProperties: false,
        },
      };
  }
}

export function buildCatalogDocument(catalog: CatalogDefinition): Record<string, unknown> {
  const components: Record<string, unknown> = {};
  for (const [name, spec] of Object.entries(catalog.components)) {
    const properties: Record<string, unknown> = {
      id: { type: 'string', description: 'Unique id of this component inside the surface.' },
      component: { const: name },
    };
    for (const [prop, propSpecValue] of Object.entries(spec.props)) {
      properties[prop] = propSchema(propSpecValue);
    }
    components[name] = {
      type: 'object',
      description: spec.description,
      properties,
      required: ['id', 'component', ...(spec.required ?? [])],
      additionalProperties: false,
    };
  }

  const functions: Record<string, unknown> = {};
  for (const [name, spec] of Object.entries(catalog.functions)) {
    functions[name] = {
      description: spec.description,
      returnType: spec.returnType,
      args: Object.fromEntries(
        Object.entries(spec.args).map(([arg, meta]) => [
          arg,
          { description: meta.description, required: meta.required ?? false },
        ]),
      ),
    };
  }

  return {
    protocolVersion: 'v1.0',
    catalogId: catalog.catalogId,
    title: catalog.title,
    description: catalog.description,
    instructions: catalog.instructions,
    components,
    functions,
    $defs: { DataBinding: DATA_BINDING_SCHEMA, FunctionCall: FUNCTION_CALL_SCHEMA },
  };
}

/* -------------------------------------------------------------------------- */
/* Runtime validation (what the renderer trusts)                              */
/* -------------------------------------------------------------------------- */

export interface ValidationIssue {
  /** JSON Pointer into the offending message, for the VALIDATION_FAILED reply. */
  path: string;
  message: string;
}

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function validateFunctionCall(
  catalog: CatalogDefinition,
  value: Record<string, unknown>,
  path: string,
  issues: ValidationIssue[],
): void {
  const name = value.call as string;
  const spec = catalog.functions[name];
  if (!spec) {
    issues.push({
      path: `${path}/call`,
      message: `Unknown function "${name}". Available functions: ${Object.keys(catalog.functions).join(', ')}.`,
    });
    return;
  }
  const args = isPlainObject(value.args) ? value.args : {};
  for (const [arg, meta] of Object.entries(spec.args)) {
    if (meta.required && !(arg in args)) {
      issues.push({ path: `${path}/args`, message: `Function "${name}" requires arg "${arg}".` });
    }
  }
  for (const arg of Object.keys(args)) {
    if (!(arg in spec.args)) {
      issues.push({
        path: `${path}/args/${arg}`,
        message: `Function "${name}" does not accept arg "${arg}".`,
      });
    }
  }
}

function validateDynamic(
  catalog: CatalogDefinition,
  spec: Extract<PropSpec, { kind: 'string' | 'number' | 'boolean' }>,
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): void {
  if (isPlainObject(value)) {
    if (!spec.dynamic) {
      issues.push({
        path,
        message: `Expected a literal ${spec.kind}${
          spec.kind === 'string' && spec.values ? ` (one of ${spec.values.join(', ')})` : ''
        }; bindings and function calls are not allowed here.`,
      });
      return;
    }
    if (typeof value.path === 'string') return;
    if (typeof value.call === 'string') {
      validateFunctionCall(catalog, value, path, issues);
      return;
    }
    issues.push({ path, message: 'Objects here must be {"path": ...} or {"call": ...}.' });
    return;
  }

  if (typeof value !== spec.kind) {
    issues.push({ path, message: `Expected ${spec.kind}, received ${typeof value}.` });
    return;
  }
  if (spec.kind === 'string' && spec.values && !spec.values.includes(value as string)) {
    issues.push({
      path,
      message: `"${String(value)}" is not part of the design system. Use one of: ${spec.values.join(', ')}.`,
    });
  }
}

function validateAction(
  catalog: CatalogDefinition,
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): void {
  if (!isPlainObject(value)) {
    issues.push({ path, message: 'action must be an object.' });
    return;
  }
  const hasEvent = 'event' in value;
  const hasFunction = 'functionCall' in value;
  if (hasEvent === hasFunction) {
    issues.push({ path, message: 'action must have exactly one of "event" or "functionCall".' });
    return;
  }
  if (hasFunction) {
    if (!isPlainObject(value.functionCall)) {
      issues.push({ path: `${path}/functionCall`, message: 'functionCall must be an object.' });
      return;
    }
    validateFunctionCall(catalog, value.functionCall, `${path}/functionCall`, issues);
    return;
  }
  const event = value.event;
  if (!isPlainObject(event) || typeof event.name !== 'string') {
    issues.push({ path: `${path}/event`, message: 'event requires a string "name".' });
    return;
  }
  if ('context' in event && !isPlainObject(event.context)) {
    issues.push({ path: `${path}/event/context`, message: 'context must be an object.' });
  }
}

function validateChecks(
  catalog: CatalogDefinition,
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): void {
  if (!Array.isArray(value)) {
    issues.push({ path, message: 'checks must be an array.' });
    return;
  }
  value.forEach((rule, index) => {
    if (!isPlainObject(rule) || !isPlainObject(rule.condition)) {
      issues.push({ path: `${path}/${index}`, message: 'Each check needs a "condition" object.' });
      return;
    }
    validateFunctionCall(catalog, rule.condition, `${path}/${index}/condition`, issues);
  });
}

/**
 * Validates one component of the flat list against the catalog.
 * `path` is the pointer of this component inside the enclosing message.
 */
export function validateComponent(
  catalog: CatalogDefinition,
  component: unknown,
  path: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!isPlainObject(component)) {
    return [{ path, message: 'Component must be an object.' }];
  }
  if (typeof component.id !== 'string' || component.id.length === 0) {
    issues.push({ path: `${path}/id`, message: 'Component requires a non-empty string "id".' });
  }
  const name = component.component;
  if (typeof name !== 'string') {
    issues.push({ path: `${path}/component`, message: 'Component requires a "component" name.' });
    return issues;
  }
  const spec = catalog.components[name];
  if (!spec) {
    issues.push({
      path: `${path}/component`,
      message: `"${name}" is not in the catalog. Available components: ${Object.keys(catalog.components).join(', ')}.`,
    });
    return issues;
  }

  for (const required of spec.required ?? []) {
    if (!(required in component)) {
      issues.push({ path, message: `${name} requires the "${required}" property.` });
    }
  }

  for (const [prop, value] of Object.entries(component)) {
    if (prop === 'id' || prop === 'component') continue;
    const propSpecValue = spec.props[prop];
    if (!propSpecValue) {
      issues.push({
        path: `${path}/${prop}`,
        message: `${name} has no "${prop}" property. Allowed: ${Object.keys(spec.props).join(', ') || '(none)'}.`,
      });
      continue;
    }
    const propPath = `${path}/${prop}`;
    switch (propSpecValue.kind) {
      case 'string':
      case 'number':
      case 'boolean':
        validateDynamic(catalog, propSpecValue, value, propPath, issues);
        break;
      case 'binding':
        if (!isPlainObject(value) || typeof value.path !== 'string') {
          issues.push({
            path: propPath,
            message: 'Expected a {"path": "/pointer"} binding so user input can be written back.',
          });
        }
        break;
      case 'child':
        if (typeof value !== 'string') {
          issues.push({ path: propPath, message: 'Expected the id of a single component.' });
        }
        break;
      case 'childList':
        if (Array.isArray(value)) {
          value.forEach((entry, index) => {
            if (typeof entry !== 'string') {
              issues.push({ path: `${propPath}/${index}`, message: 'Child ids must be strings.' });
            }
          });
        } else if (isPlainObject(value)) {
          if (typeof value.componentId !== 'string' || typeof value.path !== 'string') {
            issues.push({
              path: propPath,
              message: 'A children template needs string "componentId" and "path".',
            });
          }
        } else {
          issues.push({
            path: propPath,
            message: 'children must be an array of ids or a {componentId, path} template.',
          });
        }
        break;
      case 'action':
        validateAction(catalog, value, propPath, issues);
        break;
      case 'checks':
        validateChecks(catalog, value, propPath, issues);
        break;
    }
  }

  return issues;
}

/** Every component id referenced as a child by this component. */
export function childReferences(catalog: CatalogDefinition, component: A2uiLikeComponent): string[] {
  const spec = catalog.components[component.component];
  if (!spec) return [];
  const refs: string[] = [];
  for (const [prop, propSpecValue] of Object.entries(spec.props)) {
    const value = (component as Record<string, unknown>)[prop];
    if (value === undefined) continue;
    if (propSpecValue.kind === 'child' && typeof value === 'string') refs.push(value);
    if (propSpecValue.kind === 'childList') {
      if (Array.isArray(value)) refs.push(...value.filter((v): v is string => typeof v === 'string'));
      else if (isPlainObject(value) && typeof value.componentId === 'string') {
        refs.push(value.componentId);
      }
    }
  }
  return refs;
}

interface A2uiLikeComponent {
  id: string;
  component: string;
  [prop: string]: unknown;
}
