/**
 * The gate between the model and the renderer.
 *
 * Everything the agent emits passes through here. Failures are not thrown away:
 * they are formatted as A2UI `VALIDATION_FAILED` feedback and returned to the
 * model as the tool result, so it can correct itself on the next turn — the
 * self-healing loop the spec describes.
 */

import { CatalogDefinition, childReferences, ValidationIssue, validateComponent } from './catalog/define';
import { A2uiComponent, A2UI_VERSION, AgentToRendererMessage } from './protocol/types';
import { ROOT_COMPONENT_ID, SurfaceMap } from './runtime/surface';

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
}

const PAYLOAD_KEYS = ['createSurface', 'updateComponents', 'updateDataModel', 'deleteSurface'];

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * @param surfaces Server-side mirror of what the renderer already holds, so
 *                 incremental updates can be checked against real ids.
 */
export function validateMessages(
  catalog: CatalogDefinition,
  messages: unknown,
  surfaces: SurfaceMap = {},
): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!Array.isArray(messages)) {
    return { ok: false, issues: [{ path: '', message: 'Expected an array of A2UI messages.' }] };
  }
  if (messages.length === 0) {
    return { ok: false, issues: [{ path: '', message: 'Expected at least one A2UI message.' }] };
  }

  // Component ids known per surface as the batch is walked, so a component
  // added in message 2 can be referenced by message 3.
  const known: Record<string, Set<string>> = {};
  for (const [surfaceId, surface] of Object.entries(surfaces)) {
    known[surfaceId] = new Set(Object.keys(surface.components));
  }
  const createdInBatch = new Set<string>();

  messages.forEach((message, index) => {
    const base = `/${index}`;
    if (!isPlainObject(message)) {
      issues.push({ path: base, message: 'Each message must be an object.' });
      return;
    }
    if (message.version !== A2UI_VERSION) {
      issues.push({ path: `${base}/version`, message: `Every message needs "version": "${A2UI_VERSION}".` });
    }
    const payloadKeys = PAYLOAD_KEYS.filter((key) => key in message);
    if (payloadKeys.length !== 1) {
      issues.push({
        path: base,
        message: `Each message carries exactly one of: ${PAYLOAD_KEYS.join(', ')}.`,
      });
      return;
    }

    const kind = payloadKeys[0];
    const payload = message[kind];
    if (!isPlainObject(payload) || typeof payload.surfaceId !== 'string' || !payload.surfaceId) {
      issues.push({ path: `${base}/${kind}/surfaceId`, message: 'A string surfaceId is required.' });
      return;
    }
    const surfaceId = payload.surfaceId;

    if (kind === 'createSurface') {
      if (surfaces[surfaceId] || createdInBatch.has(surfaceId)) {
        issues.push({
          path: `${base}/createSurface/surfaceId`,
          message: `Surface "${surfaceId}" already exists. Pick a new id, or update the existing surface.`,
        });
      }
      createdInBatch.add(surfaceId);
      known[surfaceId] ??= new Set<string>();

      if (payload.catalogId !== undefined && payload.catalogId !== catalog.catalogId) {
        issues.push({
          path: `${base}/createSurface/catalogId`,
          message: `Only catalogId "${catalog.catalogId}" is supported by this renderer.`,
        });
      }
      if (payload.dataModel !== undefined && !isPlainObject(payload.dataModel)) {
        issues.push({ path: `${base}/createSurface/dataModel`, message: 'dataModel must be an object.' });
      }
      validateComponentList(
        catalog,
        payload.components,
        `${base}/createSurface/components`,
        known[surfaceId],
        issues,
        { requireRoot: true },
      );
      return;
    }

    if (!surfaces[surfaceId] && !createdInBatch.has(surfaceId)) {
      issues.push({
        path: `${base}/${kind}/surfaceId`,
        message: `Unknown surface "${surfaceId}". Create it first with createSurface.`,
      });
      return;
    }

    if (kind === 'updateComponents') {
      known[surfaceId] ??= new Set<string>();
      validateComponentList(
        catalog,
        payload.components,
        `${base}/updateComponents/components`,
        known[surfaceId],
        issues,
        { requireRoot: false },
      );
      return;
    }

    if (kind === 'updateDataModel') {
      if (typeof payload.path !== 'string') {
        issues.push({
          path: `${base}/updateDataModel/path`,
          message: 'path must be a JSON Pointer string, e.g. "/repo/stars".',
        });
      } else if (payload.path !== '' && !payload.path.startsWith('/')) {
        issues.push({
          path: `${base}/updateDataModel/path`,
          message: `"${payload.path}" must start with "/" (use "" to replace the whole model).`,
        });
      }
      if (!('value' in payload)) {
        issues.push({ path: `${base}/updateDataModel`, message: 'updateDataModel requires "value".' });
      }
    }
  });

  return { ok: issues.length === 0, issues };
}

function validateComponentList(
  catalog: CatalogDefinition,
  components: unknown,
  path: string,
  known: Set<string>,
  issues: ValidationIssue[],
  opts: { requireRoot: boolean },
): void {
  if (components === undefined) {
    if (opts.requireRoot) {
      issues.push({ path, message: 'createSurface needs its components, including one with id "root".' });
    }
    return;
  }
  if (!Array.isArray(components)) {
    issues.push({ path, message: 'components must be an array.' });
    return;
  }

  const references: { id: string; path: string }[] = [];
  const seen = new Set<string>();

  components.forEach((component, index) => {
    const componentPath = `${path}/${index}`;
    const componentIssues = validateComponent(catalog, component, componentPath);
    issues.push(...componentIssues);
    if (componentIssues.length > 0 || !isPlainObject(component)) return;

    const id = component.id as string;
    if (seen.has(id)) {
      issues.push({ path: `${componentPath}/id`, message: `Duplicate component id "${id}".` });
    }
    seen.add(id);
    known.add(id);
    for (const ref of childReferences(catalog, component as A2uiComponent)) {
      references.push({ id: ref, path: componentPath });
    }
  });

  if (opts.requireRoot && !known.has(ROOT_COMPONENT_ID)) {
    issues.push({ path, message: 'Every surface needs a component with id "root".' });
  }

  for (const reference of references) {
    if (!known.has(reference.id)) {
      issues.push({
        path: reference.path,
        message: `References child "${reference.id}", which is not defined in this surface.`,
      });
    }
  }
}

/** Renders issues as the corrective message handed back to the model. */
export function formatValidationFeedback(issues: ValidationIssue[]): string {
  const lines = issues
    .slice(0, 12)
    .map((issue) => `- ${issue.path || '(message)'}: ${issue.message}`)
    .join('\n');
  const overflow = issues.length > 12 ? `\n- ...and ${issues.length - 12} more.` : '';
  return [
    'VALIDATION_FAILED — nothing was rendered. Fix these and call the tool again:',
    lines + overflow,
  ].join('\n');
}

export type { AgentToRendererMessage };
