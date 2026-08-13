/**
 * The surface store: pure reducer that folds agent messages into renderable
 * state. It runs unchanged on the client (to render) and on the server (to keep
 * a mirror the agent can be validated against), which is what lets the agent
 * send incremental updates instead of re-emitting whole widgets.
 */

import {
  A2uiComponent,
  AgentToRendererMessage,
  isCreateSurface,
  isDeleteSurface,
  isUpdateComponents,
  isUpdateDataModel,
  surfaceIdOf,
} from '../protocol/types';
import { setAtPointer } from './pointer';

export interface SurfaceState {
  surfaceId: string;
  catalogId?: string;
  sendDataModel: boolean;
  components: Record<string, A2uiComponent>;
  dataModel: Record<string, unknown>;
  /** Bumped on every applied message; used as a cheap render key. */
  revision: number;
}

export type SurfaceMap = Record<string, SurfaceState>;

export interface ApplyResult {
  surfaces: SurfaceMap;
  /** Set when the message could not be applied; mirrors an A2UI error payload. */
  error?: { code: 'VALIDATION_FAILED'; surfaceId: string; path?: string; message: string };
}

function indexComponents(components: A2uiComponent[] | undefined): Record<string, A2uiComponent> {
  const map: Record<string, A2uiComponent> = {};
  for (const component of components ?? []) {
    if (component && typeof component.id === 'string') map[component.id] = component;
  }
  return map;
}

export function applyMessage(surfaces: SurfaceMap, message: AgentToRendererMessage): ApplyResult {
  const surfaceId = surfaceIdOf(message);

  if (isCreateSurface(message)) {
    const { catalogId, components, dataModel, sendDataModel } = message.createSurface;
    if (surfaces[surfaceId]) {
      return {
        surfaces,
        error: {
          code: 'VALIDATION_FAILED',
          surfaceId,
          path: '/createSurface/surfaceId',
          message: `Surface "${surfaceId}" already exists. Surface ids must be unique; update it instead.`,
        },
      };
    }
    return {
      surfaces: {
        ...surfaces,
        [surfaceId]: {
          surfaceId,
          catalogId,
          sendDataModel: sendDataModel ?? false,
          components: indexComponents(components),
          dataModel: dataModel ?? {},
          revision: 1,
        },
      },
    };
  }

  if (isDeleteSurface(message)) {
    if (!surfaces[surfaceId]) return { surfaces };
    const next = { ...surfaces };
    delete next[surfaceId];
    return { surfaces: next };
  }

  const existing = surfaces[surfaceId];
  if (!existing) {
    return {
      surfaces,
      error: {
        code: 'VALIDATION_FAILED',
        surfaceId,
        message: `Unknown surface "${surfaceId}". Send createSurface before updating it.`,
      },
    };
  }

  if (isUpdateComponents(message)) {
    return {
      surfaces: {
        ...surfaces,
        [surfaceId]: {
          ...existing,
          components: { ...existing.components, ...indexComponents(message.updateComponents.components) },
          revision: existing.revision + 1,
        },
      },
    };
  }

  if (isUpdateDataModel(message)) {
    const { path, value } = message.updateDataModel;
    const dataModel = setAtPointer(existing.dataModel, path, value) as Record<string, unknown>;
    return {
      surfaces: {
        ...surfaces,
        [surfaceId]: { ...existing, dataModel, revision: existing.revision + 1 },
      },
    };
  }

  return { surfaces };
}

export function applyMessages(
  surfaces: SurfaceMap,
  messages: AgentToRendererMessage[],
): ApplyResult {
  let current = surfaces;
  let firstError: ApplyResult['error'];
  for (const message of messages) {
    const result = applyMessage(current, message);
    current = result.surfaces;
    if (result.error && !firstError) firstError = result.error;
  }
  return { surfaces: current, error: firstError };
}

export const ROOT_COMPONENT_ID = 'root';
