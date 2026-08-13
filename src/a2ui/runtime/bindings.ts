/**
 * Resolution of dynamic values: literals, `{path}` bindings, and the handful of
 * pure catalog functions the renderer is allowed to execute.
 *
 * Nothing here evaluates agent-supplied code — `formatString`, `required` and
 * `regex` are implemented natively, and anything else is reported as a
 * validation error back to the agent.
 */

import { CheckRule, DynamicValue, isDataBinding, isFunctionCall } from '../protocol/types';
import { getAtPointer, resolvePointer } from './pointer';

export interface BindingScope {
  dataModel: unknown;
  /** Pointer prefix for values inside a children template, e.g. "/issues/2". */
  scope?: string;
}

const PLACEHOLDER = /\$\{([^}]+)\}/g;

function formatString(template: unknown, ctx: BindingScope): string {
  if (typeof template !== 'string') return '';
  return template.replace(PLACEHOLDER, (_match, pointer: string) => {
    const resolved = getAtPointer(ctx.dataModel, resolvePointer(pointer.trim(), ctx.scope ?? ''));
    if (resolved === null || resolved === undefined) return '';
    if (typeof resolved === 'object') return JSON.stringify(resolved);
    return String(resolved);
  });
}

/** Resolves a catalog prop value against the data model. */
export function resolveValue(value: DynamicValue | unknown, ctx: BindingScope): unknown {
  if (isDataBinding(value)) {
    return getAtPointer(ctx.dataModel, resolvePointer(value.path, ctx.scope ?? ''));
  }
  if (isFunctionCall(value)) {
    switch (value.call) {
      case 'formatString':
        return formatString(resolveValue(value.args?.value, ctx), ctx);
      default:
        return undefined;
    }
  }
  return value;
}

export function resolveString(value: unknown, ctx: BindingScope, fallback = ''): string {
  const resolved = resolveValue(value, ctx);
  if (resolved === null || resolved === undefined) return fallback;
  if (typeof resolved === 'object') return JSON.stringify(resolved);
  return String(resolved);
}

export function resolveNumber(value: unknown, ctx: BindingScope): number | undefined {
  const resolved = resolveValue(value, ctx);
  if (typeof resolved === 'number') return resolved;
  if (typeof resolved === 'string' && resolved.trim() !== '') {
    const parsed = Number(resolved);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

export function resolveBoolean(value: unknown, ctx: BindingScope): boolean {
  const resolved = resolveValue(value, ctx);
  return Boolean(resolved);
}

export interface CheckResult {
  ok: boolean;
  /** First failing check's message, if any. */
  message?: string;
}

export function evaluateChecks(rules: CheckRule[] | undefined, ctx: BindingScope): CheckResult {
  if (!rules?.length) return { ok: true };
  for (const rule of rules) {
    const condition = rule.condition;
    if (!isFunctionCall(condition)) continue;
    const value = resolveValue(condition.args?.value, ctx);
    let passed = true;
    switch (condition.call) {
      case 'required':
        passed =
          value !== null &&
          value !== undefined &&
          !(typeof value === 'string' && value.trim() === '') &&
          !(Array.isArray(value) && value.length === 0);
        break;
      case 'regex': {
        const pattern = resolveValue(condition.args?.pattern, ctx);
        if (typeof pattern !== 'string') {
          passed = false;
          break;
        }
        try {
          passed = new RegExp(pattern).test(value === undefined || value === null ? '' : String(value));
        } catch {
          passed = false;
        }
        break;
      }
      default:
        // Unknown functions never silently pass.
        passed = false;
    }
    if (!passed) {
      return { ok: false, message: rule.message ?? 'This value is not valid yet.' };
    }
  }
  return { ok: true };
}

/** Resolves an action's `context` map into the plain payload sent to the agent. */
export function resolveContext(
  context: Record<string, DynamicValue> | undefined,
  ctx: BindingScope,
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(context ?? {})) {
    resolved[key] = resolveValue(value, ctx);
  }
  return resolved;
}
