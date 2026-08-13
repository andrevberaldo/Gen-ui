/**
 * A2UI v1.0 wire types.
 *
 * These mirror the message envelopes defined by the A2UI specification
 * (agent_to_renderer.json / renderer_to_agent.json). Only the parts this POC
 * exercises are typed; the shapes are intentionally kept identical to the spec
 * so payloads stay portable to any other A2UI renderer.
 */

export const A2UI_VERSION = 'v1.0' as const;

export type A2uiVersion = typeof A2UI_VERSION;

/** `{"path": "/pointer"}` — a reactive read from the surface data model. */
export interface DataBinding {
  path: string;
}

/** `{"call": "formatString", "args": {...}}` — a renderer-side function. */
export interface FunctionCall {
  call: string;
  args?: Record<string, unknown>;
}

export type DynamicValue = string | number | boolean | DataBinding | FunctionCall | null;

/** Static child list, or a template repeated over an array in the data model. */
export type ChildList = string[] | { componentId: string; path: string };

export interface EventAction {
  event: {
    /** Stable identifier the agent switches on. */
    name: string;
    /** Human readable description of what the user did, for the transcript. */
    userMessage?: string | DataBinding | FunctionCall;
    /** Hand-picked view of the data model sent along with the event. */
    context?: Record<string, DynamicValue>;
  };
}

export interface FunctionAction {
  functionCall: FunctionCall;
}

export type Action = EventAction | FunctionAction;

export interface CheckRule {
  condition: FunctionCall;
  message?: string;
}

/** A single node of the flat component list. */
export interface A2uiComponent {
  id: string;
  component: string;
  [prop: string]: unknown;
}

export interface CreateSurfaceMessage {
  version: A2uiVersion;
  createSurface: {
    surfaceId: string;
    catalogId?: string;
    sendDataModel?: boolean;
    components?: A2uiComponent[];
    dataModel?: Record<string, unknown>;
  };
}

export interface UpdateComponentsMessage {
  version: A2uiVersion;
  updateComponents: {
    surfaceId: string;
    components: A2uiComponent[];
  };
}

export interface UpdateDataModelMessage {
  version: A2uiVersion;
  updateDataModel: {
    surfaceId: string;
    /** JSON Pointer (RFC 6901). Empty string / "/" replaces the root. */
    path: string;
    value: unknown;
  };
}

export interface DeleteSurfaceMessage {
  version: A2uiVersion;
  deleteSurface: {
    surfaceId: string;
  };
}

export type AgentToRendererMessage =
  | CreateSurfaceMessage
  | UpdateComponentsMessage
  | UpdateDataModelMessage
  | DeleteSurfaceMessage;

export interface ActionMessage {
  version: A2uiVersion;
  action: {
    name: string;
    surfaceId: string;
    sourceComponentId: string;
    /** ISO 8601. */
    timestamp: string;
    context: Record<string, unknown>;
    userMessage?: string;
  };
}

export type RendererErrorCode = 'VALIDATION_FAILED' | 'RENDER_FAILED' | 'FUNCTION_FAILED';

export interface ErrorMessage {
  version: A2uiVersion;
  error: {
    code: RendererErrorCode;
    surfaceId?: string;
    path?: string;
    message: string;
  };
}

export type RendererToAgentMessage = ActionMessage | ErrorMessage;

export function isCreateSurface(m: AgentToRendererMessage): m is CreateSurfaceMessage {
  return 'createSurface' in m;
}

export function isUpdateComponents(m: AgentToRendererMessage): m is UpdateComponentsMessage {
  return 'updateComponents' in m;
}

export function isUpdateDataModel(m: AgentToRendererMessage): m is UpdateDataModelMessage {
  return 'updateDataModel' in m;
}

export function isDeleteSurface(m: AgentToRendererMessage): m is DeleteSurfaceMessage {
  return 'deleteSurface' in m;
}

export function isDataBinding(value: unknown): value is DataBinding {
  return (
    typeof value === 'object' &&
    value !== null &&
    'path' in value &&
    typeof (value as DataBinding).path === 'string'
  );
}

export function isFunctionCall(value: unknown): value is FunctionCall {
  return (
    typeof value === 'object' &&
    value !== null &&
    'call' in value &&
    typeof (value as FunctionCall).call === 'string'
  );
}

export function isEventAction(action: Action): action is EventAction {
  return 'event' in action;
}

export function isFunctionAction(action: Action): action is FunctionAction {
  return 'functionCall' in action;
}

/** The surfaceId the message targets, whatever its kind. */
export function surfaceIdOf(message: AgentToRendererMessage): string {
  if (isCreateSurface(message)) return message.createSurface.surfaceId;
  if (isUpdateComponents(message)) return message.updateComponents.surfaceId;
  if (isUpdateDataModel(message)) return message.updateDataModel.surfaceId;
  return message.deleteSurface.surfaceId;
}
