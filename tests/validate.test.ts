import { describe, expect, it } from 'vitest';
import { designSystemCatalog, CATALOG_ID } from '../src/a2ui/catalog/design-system';
import { validateMessages } from '../src/a2ui/validate';
import { A2UI_VERSION } from '../src/a2ui/protocol/types';
import { applyMessages } from '../src/a2ui/runtime/surface';

const surface = (components: unknown[], dataModel: Record<string, unknown> = {}) => [
  {
    version: A2UI_VERSION,
    createSurface: { surfaceId: 'w1', catalogId: CATALOG_ID, components, dataModel },
  },
];

const validWidget = surface(
  [
    { id: 'root', component: 'Card', child: 'body' },
    { id: 'body', component: 'Column', gap: 'md', children: ['title', 'stat', 'button'] },
    { id: 'title', component: 'Text', text: { path: '/repo/name' }, variant: 'heading' },
    { id: 'stat', component: 'Stat', label: 'Stars', value: { path: '/repo/stars' }, icon: 'star' },
    {
      id: 'button',
      component: 'Button',
      variant: 'primary',
      child: 'title',
      action: { event: { name: 'refresh', context: { repo: { path: '/repo/name' } } } },
    },
  ],
  { repo: { name: 'facebook/react', stars: '230k' } },
);

const check = (messages: unknown) => validateMessages(designSystemCatalog, messages);

describe('catalog validation', () => {
  it('accepts a widget built from the catalog', () => {
    expect(check(validWidget)).toEqual({ ok: true, issues: [] });
  });

  it('rejects components that are not in the catalog', () => {
    const result = check(surface([{ id: 'root', component: 'Marquee', child: 'x' }]));
    expect(result.ok).toBe(false);
    expect(result.issues[0].message).toContain('not in the catalog');
  });

  it('rejects props the design system does not expose', () => {
    const result = check(
      surface([
        { id: 'root', component: 'Card', child: 'body' },
        { id: 'body', component: 'Text', text: 'hi', style: { color: 'red' } },
      ]),
    );
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.message.includes('no "style" property'))).toBe(true);
  });

  it('rejects variants outside the design system', () => {
    const result = check(
      surface([
        { id: 'root', component: 'Card', child: 'body' },
        { id: 'body', component: 'Text', text: 'hi', tone: 'hotpink' },
      ]),
    );
    expect(result.ok).toBe(false);
    expect(result.issues[0].message).toContain('not part of the design system');
  });

  it('rejects references to children that were never defined', () => {
    const result = check(surface([{ id: 'root', component: 'Card', child: 'ghost' }]));
    expect(result.ok).toBe(false);
    expect(result.issues[0].message).toContain('not defined in this surface');
  });

  it('requires a root component', () => {
    const result = check(surface([{ id: 'body', component: 'Text', text: 'hi' }]));
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.message.includes('id "root"'))).toBe(true);
  });

  it('rejects duplicate component ids', () => {
    const result = check(
      surface([
        { id: 'root', component: 'Card', child: 'root' },
        { id: 'root', component: 'Text', text: 'hi' },
      ]),
    );
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.message.includes('Duplicate'))).toBe(true);
  });

  it('requires required props', () => {
    const result = check(
      surface([
        { id: 'root', component: 'Card', child: 'body' },
        { id: 'body', component: 'Button', child: 'label' },
        { id: 'label', component: 'Text', text: 'Go' },
      ]),
    );
    expect(result.ok).toBe(false);
    expect(result.issues[0].message).toContain('requires the "action" property');
  });

  it('rejects unknown catalog functions', () => {
    const result = check(
      surface([
        { id: 'root', component: 'Card', child: 'body' },
        { id: 'body', component: 'Text', text: { call: 'evalJs', args: { value: '1+1' } } },
      ]),
    );
    expect(result.ok).toBe(false);
    expect(result.issues[0].message).toContain('Unknown function');
  });

  it('requires a binding for two-way bound inputs', () => {
    const result = check(
      surface([
        { id: 'root', component: 'Card', child: 'body' },
        { id: 'body', component: 'TextField', value: 'literal' },
      ]),
    );
    expect(result.ok).toBe(false);
    expect(result.issues[0].message).toContain('binding');
  });

  it('rejects updates to surfaces the renderer does not hold', () => {
    const result = check([
      { version: A2UI_VERSION, updateDataModel: { surfaceId: 'nope', path: '/a', value: 1 } },
    ]);
    expect(result.ok).toBe(false);
    expect(result.issues[0].message).toContain('Unknown surface');
  });

  it('accepts incremental updates once the surface exists', () => {
    const { surfaces } = applyMessages({}, validWidget as never);
    const result = validateMessages(
      designSystemCatalog,
      [
        {
          version: A2UI_VERSION,
          updateDataModel: { surfaceId: 'w1', path: '/repo/stars', value: '231k' },
        },
      ],
      surfaces,
    );
    expect(result.ok).toBe(true);
  });

  it('rejects a data model path that is not a JSON Pointer', () => {
    const { surfaces } = applyMessages({}, validWidget as never);
    const result = validateMessages(
      designSystemCatalog,
      [{ version: A2UI_VERSION, updateDataModel: { surfaceId: 'w1', path: 'repo.stars', value: 1 } }],
      surfaces,
    );
    expect(result.ok).toBe(false);
    expect(result.issues[0].message).toContain('must start with "/"');
  });

  it('rejects messages without a protocol version', () => {
    const result = check([{ createSurface: { surfaceId: 'w1', components: [] } }]);
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.message.includes('"version"'))).toBe(true);
  });
});
