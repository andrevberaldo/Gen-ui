'use client';

/**
 * The A2UI renderer.
 *
 * Walks the flat component list of a surface, resolves data bindings, and maps
 * every node onto a design-system component. It is the only place that decides
 * how an abstract component becomes pixels — the agent has no say in it.
 */

import { Fragment, type ReactNode, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Divider,
  DsImage,
  Icon,
  List,
  ProgressBar,
  Spinner,
  Stack,
  Stat,
  Text,
  TextField,
} from '../../design-system';
import {
  A2uiComponent,
  Action,
  CheckRule,
  isEventAction,
  isFunctionAction,
} from '../protocol/types';
import {
  BindingScope,
  evaluateChecks,
  resolveContext,
  resolveNumber,
  resolveString,
  resolveValue,
} from '../runtime/bindings';
import { getAtPointer, resolvePointer } from '../runtime/pointer';
import { ROOT_COMPONENT_ID, SurfaceState } from '../runtime/surface';

export interface SurfaceEvent {
  name: string;
  sourceComponentId: string;
  context: Record<string, unknown>;
  userMessage?: string;
}

export interface SurfaceRendererProps {
  surface: SurfaceState;
  /** True while an action dispatched from this surface is being handled. */
  pending?: boolean;
  onEvent: (event: SurfaceEvent) => void;
  onWrite: (path: string, value: unknown) => void;
  onError?: (error: { code: 'RENDER_FAILED'; path?: string; message: string }) => void;
}

const MAX_DEPTH = 24;

export function SurfaceRenderer({ surface, pending, onEvent, onWrite, onError }: SurfaceRendererProps) {
  const [activeComponentId, setActiveComponentId] = useState<string | null>(null);

  const dataModel = surface.dataModel;
  const reported = new Set<string>();

  const fail = (message: string, path?: string): ReactNode => {
    if (onError && !reported.has(message)) {
      reported.add(message);
      // Deferred so the renderer never sets state during another render pass.
      queueMicrotask(() => onError({ code: 'RENDER_FAILED', path, message }));
    }
    return <Alert tone="negative" title="This part of the widget could not be rendered" message={message} />;
  };

  const dispatch = (component: A2uiComponent, action: Action, ctx: BindingScope) => {
    if (isFunctionAction(action)) {
      const { call, args } = action.functionCall;
      if (call === 'openUrl') {
        const url = resolveString(args?.url, ctx);
        if (/^https?:\/\//i.test(url)) window.open(url, '_blank', 'noopener,noreferrer');
        return;
      }
      onError?.({ code: 'RENDER_FAILED', message: `Unsupported local function "${call}".` });
      return;
    }
    if (!isEventAction(action)) return;
    setActiveComponentId(component.id);
    onEvent({
      name: action.event.name,
      sourceComponentId: component.id,
      context: resolveContext(action.event.context, ctx),
      userMessage: action.event.userMessage
        ? resolveString(action.event.userMessage, ctx)
        : undefined,
    });
  };

  const renderChildren = (component: A2uiComponent, ctx: BindingScope, depth: number): ReactNode[] => {
    const children = component.children;
    if (Array.isArray(children)) {
      return children.map((id, index) => (
        <Fragment key={`${id}:${index}`}>{renderById(String(id), ctx, depth + 1)}</Fragment>
      ));
    }
    if (children && typeof children === 'object') {
      const { componentId, path } = children as { componentId: string; path: string };
      const absolute = resolvePointer(path, ctx.scope ?? '');
      const items = getAtPointer(dataModel, absolute);
      if (!Array.isArray(items)) return [];
      return items.map((_item, index) => (
        <Fragment key={`${componentId}:${index}`}>
          {renderById(componentId, { ...ctx, scope: `${absolute}/${index}` }, depth + 1)}
        </Fragment>
      ));
    }
    return [];
  };

  const renderById = (id: string, ctx: BindingScope, depth: number): ReactNode => {
    if (depth > MAX_DEPTH) return fail(`Component tree is deeper than ${MAX_DEPTH} levels at "${id}".`);
    const component = surface.components[id];
    if (!component) return fail(`Component "${id}" is referenced but was never defined.`);
    return renderComponent(component, ctx, depth);
  };

  const renderComponent = (component: A2uiComponent, ctx: BindingScope, depth: number): ReactNode => {
    const str = (value: unknown, fallback = '') => resolveString(value, ctx, fallback);
    const optionalStr = (value: unknown) => (value === undefined ? undefined : resolveString(value, ctx));
    const literal = (value: unknown) => (typeof value === 'string' ? value : undefined);
    const weight = typeof component.weight === 'number' ? component.weight : undefined;

    switch (component.component) {
      case 'Column':
      case 'Row':
        return (
          <Stack
            direction={component.component === 'Row' ? 'row' : 'column'}
            gap={literal(component.gap)}
            align={literal(component.align)}
            justify={literal(component.justify)}
            wrap={component.component === 'Row' ? component.wrap !== false : Boolean(component.wrap)}
            weight={weight}
          >
            {renderChildren(component, ctx, depth)}
          </Stack>
        );

      case 'Card':
        return (
          <Card tone={literal(component.tone)} weight={weight}>
            {renderById(String(component.child), ctx, depth + 1)}
          </Card>
        );

      case 'List': {
        const items = renderChildren(component, ctx, depth);
        return (
          <List variant={literal(component.variant)} weight={weight}>
            {items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </List>
        );
      }

      case 'Text':
        return (
          <Text
            text={str(component.text)}
            variant={literal(component.variant)}
            tone={literal(component.tone)}
            weight={weight}
          />
        );

      case 'Badge':
        return <Badge label={str(component.label)} tone={literal(component.tone)} icon={literal(component.icon)} />;

      case 'Stat':
        return (
          <Stat
            label={str(component.label)}
            value={str(component.value)}
            delta={optionalStr(component.delta)}
            deltaTone={literal(component.deltaTone)}
            icon={literal(component.icon)}
            weight={weight}
          />
        );

      case 'Divider':
        return <Divider />;

      case 'Image':
        return (
          <DsImage
            url={str(component.url)}
            alt={str(component.alt)}
            shape={literal(component.shape)}
            size={literal(component.size)}
          />
        );

      case 'Icon':
        return <Icon name={str(component.name)} tone={literal(component.tone)} size={literal(component.size) as 'sm' | 'md' | 'lg'} />;

      case 'ProgressBar':
        return (
          <ProgressBar
            value={resolveNumber(component.value, ctx) ?? 0}
            label={optionalStr(component.label)}
            tone={literal(component.tone)}
          />
        );

      case 'Spinner':
        return <Spinner label={optionalStr(component.label)} />;

      case 'Alert':
        return (
          <Alert title={str(component.title)} message={optionalStr(component.message)} tone={literal(component.tone)} />
        );

      case 'Button': {
        const check = evaluateChecks(component.checks as CheckRule[] | undefined, ctx);
        const busy = pending === true && activeComponentId === component.id;
        const disabled =
          !check.ok || Boolean(resolveValue(component.disabled, ctx)) || (pending === true && !busy);
        return (
          <Button
            variant={literal(component.variant)}
            disabled={disabled}
            busy={busy}
            title={check.ok ? undefined : check.message}
            weight={weight}
            onClick={() => dispatch(component, component.action as Action, ctx)}
          >
            {renderById(String(component.child), ctx, depth + 1)}
          </Button>
        );
      }

      case 'TextField': {
        const bindingPath = (component.value as { path?: string } | undefined)?.path;
        if (!bindingPath) return fail(`TextField "${component.id}" needs a {"path": ...} value binding.`);
        const absolute = resolvePointer(bindingPath, ctx.scope ?? '');
        const current = getAtPointer(dataModel, absolute);
        const check = evaluateChecks(component.checks as CheckRule[] | undefined, ctx);
        return (
          <TextField
            label={optionalStr(component.label)}
            placeholder={optionalStr(component.placeholder)}
            variant={literal(component.variant)}
            value={current === undefined || current === null ? '' : String(current)}
            error={current === undefined || current === '' ? undefined : check.ok ? undefined : check.message}
            weight={weight}
            onChange={(value) => onWrite(absolute, value)}
          />
        );
      }

      default:
        return fail(`"${component.component}" is not a component of this catalog.`);
    }
  };

  return <>{renderById(ROOT_COMPONENT_ID, { dataModel }, 0)}</>;
}
