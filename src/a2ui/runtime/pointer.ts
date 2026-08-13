/**
 * Minimal RFC 6901 JSON Pointer support for the surface data model.
 *
 * Pointers starting with "/" are absolute (from the surface root). Anything
 * else is relative and is resolved against the current template scope, which is
 * how children templates address their array item.
 */

export function parsePointer(pointer: string): string[] {
  if (pointer === '' || pointer === '/') return [];
  const trimmed = pointer.startsWith('/') ? pointer.slice(1) : pointer;
  return trimmed
    .split('/')
    .map((token) => token.replace(/~1/g, '/').replace(/~0/g, '~'));
}

export function isAbsolutePointer(pointer: string): boolean {
  return pointer.startsWith('/') || pointer === '';
}

/** Joins a template scope with a possibly-relative pointer. */
export function resolvePointer(pointer: string, scope = ''): string {
  if (isAbsolutePointer(pointer)) return pointer;
  const base = scope.endsWith('/') ? scope.slice(0, -1) : scope;
  return `${base}/${pointer}`;
}

export function getAtPointer(root: unknown, pointer: string): unknown {
  const tokens = parsePointer(pointer);
  let current: unknown = root;
  for (const token of tokens) {
    if (current === null || current === undefined) return undefined;
    if (Array.isArray(current)) {
      const index = Number(token);
      if (!Number.isInteger(index)) return undefined;
      current = current[index];
      continue;
    }
    if (typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[token];
  }
  return current;
}

/** Immutable write. Missing intermediate containers are created. */
export function setAtPointer<T>(root: T, pointer: string, value: unknown): T {
  const tokens = parsePointer(pointer);
  if (tokens.length === 0) return value as T;

  const clone = (node: unknown, index: number): unknown => {
    const token = tokens[index];
    const isLast = index === tokens.length - 1;
    const arrayIndex = Number(token);
    const wantsArray = Number.isInteger(arrayIndex) && arrayIndex >= 0;

    if (Array.isArray(node)) {
      const next = [...node];
      next[arrayIndex] = isLast ? value : clone(node[arrayIndex], index + 1);
      return next;
    }

    const base =
      typeof node === 'object' && node !== null
        ? { ...(node as Record<string, unknown>) }
        : wantsArray && node === undefined
          ? ({} as Record<string, unknown>)
          : {};
    base[token] = isLast ? value : clone((node as Record<string, unknown> | undefined)?.[token], index + 1);
    return base;
  };

  return clone(root, 0) as T;
}
