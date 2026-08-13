import { describe, expect, it } from 'vitest';
import { getAtPointer, resolvePointer, setAtPointer } from '../src/a2ui/runtime/pointer';
import { evaluateChecks, resolveContext, resolveString, resolveValue } from '../src/a2ui/runtime/bindings';
import { applyMessage, applyMessages, type SurfaceMap } from '../src/a2ui/runtime/surface';
import { A2UI_VERSION, type AgentToRendererMessage } from '../src/a2ui/protocol/types';

describe('json pointer', () => {
  const model = { repo: { stars: 12, tags: ['a', 'b'] } };

  it('reads nested values and array indices', () => {
    expect(getAtPointer(model, '/repo/stars')).toBe(12);
    expect(getAtPointer(model, '/repo/tags/1')).toBe('b');
    expect(getAtPointer(model, '/repo/missing')).toBeUndefined();
  });

  it('writes immutably and creates missing containers', () => {
    const next = setAtPointer(model, '/repo/forks', 3);
    expect(next).not.toBe(model);
    expect(getAtPointer(next, '/repo/forks')).toBe(3);
    expect(getAtPointer(model, '/repo/forks')).toBeUndefined();
    expect(getAtPointer(setAtPointer(model, '/meta/status', 'ok'), '/meta/status')).toBe('ok');
  });

  it('preserves arrays when writing into them', () => {
    const next = setAtPointer(model, '/repo/tags/0', 'z');
    expect(getAtPointer(next, '/repo/tags')).toEqual(['z', 'b']);
  });

  it('scopes relative pointers to the template item', () => {
    expect(resolvePointer('title', '/items/2')).toBe('/items/2/title');
    expect(resolvePointer('/absolute', '/items/2')).toBe('/absolute');
  });
});

describe('bindings', () => {
  const dataModel = {
    repo: { name: 'facebook/react', stars: '230k' },
    items: [{ title: 'first' }, { title: 'second' }],
    form: { repo: '' },
  };

  it('passes literals through and resolves path bindings', () => {
    expect(resolveValue('hello', { dataModel })).toBe('hello');
    expect(resolveValue({ path: '/repo/name' }, { dataModel })).toBe('facebook/react');
  });

  it('interpolates with formatString', () => {
    const value = {
      call: 'formatString',
      args: { value: '${/repo/name} · ${/repo/stars} stars' },
    };
    expect(resolveString(value, { dataModel })).toBe('facebook/react · 230k stars');
  });

  it('resolves template-scoped paths', () => {
    expect(resolveString({ path: 'title' }, { dataModel, scope: '/items/1' })).toBe('second');
  });

  it('ignores unknown functions rather than executing them', () => {
    expect(resolveValue({ call: 'fetch', args: { url: 'http://x' } }, { dataModel })).toBeUndefined();
  });

  it('evaluates required and regex checks', () => {
    const required = [
      { condition: { call: 'required', args: { value: { path: '/form/repo' } } }, message: 'Required.' },
    ];
    expect(evaluateChecks(required, { dataModel })).toEqual({ ok: false, message: 'Required.' });
    expect(
      evaluateChecks(required, { dataModel: { form: { repo: 'a/b' } } }),
    ).toEqual({ ok: true });

    const pattern = [
      {
        condition: {
          call: 'regex',
          args: { value: { path: '/form/repo' }, pattern: '^[\\w.-]+/[\\w.-]+$' },
        },
        message: 'owner/name please.',
      },
    ];
    expect(evaluateChecks(pattern, { dataModel: { form: { repo: 'nope' } } }).ok).toBe(false);
    expect(evaluateChecks(pattern, { dataModel: { form: { repo: 'a/b' } } }).ok).toBe(true);
  });

  it('fails checks that call an unknown function', () => {
    const rules = [{ condition: { call: 'always', args: {} }, message: 'nope' }];
    expect(evaluateChecks(rules, { dataModel }).ok).toBe(false);
  });

  it('resolves an action context into plain values', () => {
    expect(resolveContext({ repo: { path: '/repo/name' }, mode: 'full' }, { dataModel })).toEqual({
      repo: 'facebook/react',
      mode: 'full',
    });
  });
});

describe('surface store', () => {
  const create: AgentToRendererMessage = {
    version: A2UI_VERSION,
    createSurface: {
      surfaceId: 'w1',
      components: [
        { id: 'root', component: 'Card', child: 'text' },
        { id: 'text', component: 'Text', text: { path: '/status' } },
      ],
      dataModel: { status: 'loading' },
    },
  };

  it('creates, updates data, merges components and deletes', () => {
    const created = applyMessage({}, create).surfaces;
    expect(Object.keys(created.w1.components)).toEqual(['root', 'text']);
    expect(created.w1.dataModel.status).toBe('loading');

    const updated = applyMessage(created, {
      version: A2UI_VERSION,
      updateDataModel: { surfaceId: 'w1', path: '/status', value: 'ready' },
    }).surfaces;
    expect(updated.w1.dataModel.status).toBe('ready');
    expect(updated.w1.revision).toBe(2);
    // The original surface is untouched — updates are immutable.
    expect(created.w1.dataModel.status).toBe('loading');

    const restructured = applyMessage(updated, {
      version: A2UI_VERSION,
      updateComponents: {
        surfaceId: 'w1',
        components: [{ id: 'text', component: 'Text', text: 'literal', variant: 'heading' }],
      },
    }).surfaces;
    expect(restructured.w1.components.text.variant).toBe('heading');
    expect(restructured.w1.components.root).toBeDefined();

    const deleted = applyMessage(restructured, {
      version: A2UI_VERSION,
      deleteSurface: { surfaceId: 'w1' },
    }).surfaces;
    expect(deleted.w1).toBeUndefined();
  });

  it('refuses to recreate an existing surface', () => {
    const created = applyMessage({}, create).surfaces;
    const result = applyMessage(created, create);
    expect(result.error?.code).toBe('VALIDATION_FAILED');
    expect(result.error?.message).toContain('already exists');
  });

  it('refuses updates to unknown surfaces', () => {
    const result = applyMessage({} as SurfaceMap, {
      version: A2UI_VERSION,
      updateDataModel: { surfaceId: 'ghost', path: '/a', value: 1 },
    });
    expect(result.error?.message).toContain('Unknown surface');
  });

  it('applies a batch in order and reports the first failure', () => {
    const result = applyMessages({}, [
      create,
      { version: A2UI_VERSION, updateDataModel: { surfaceId: 'w1', path: '/status', value: 'ok' } },
      { version: A2UI_VERSION, updateDataModel: { surfaceId: 'ghost', path: '/a', value: 1 } },
    ]);
    expect(result.surfaces.w1.dataModel.status).toBe('ok');
    expect(result.error?.message).toContain('ghost');
  });
});
