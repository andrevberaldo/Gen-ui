'use client';

/**
 * The chat client.
 *
 * It owns the surface store and the transport, and it treats agent-rendered
 * widgets as first-class turns in the transcript: a surface created during a
 * turn is anchored to that turn, and every later `updateDataModel` re-renders
 * it in place rather than appending a new message.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SurfaceRenderer, type SurfaceEvent } from '../a2ui/react/SurfaceRenderer';
import { InlineMarkdown } from '../design-system';
import {
  A2UI_VERSION,
  type ActionMessage,
  type AgentToRendererMessage,
  isCreateSurface,
} from '../a2ui/protocol/types';
import { applyMessage, type SurfaceMap } from '../a2ui/runtime/surface';
import { setAtPointer } from '../a2ui/runtime/pointer';

interface Turn {
  id: string;
  role: 'user' | 'assistant' | 'action' | 'error';
  text: string;
  /** Surfaces introduced during this turn, rendered inline beneath the text. */
  surfaceIds: string[];
}

const SUGGESTIONS = [
  'Show me stats for vercel/next.js',
  'Compare it with facebook/react',
  'What are the open issues on anthropics/anthropic-sdk-typescript?',
];

let turnCounter = 0;
const nextId = () => `turn-${++turnCounter}`;

export function Chat({ live }: { live: boolean }) {
  const [sessionId] = useState(
    () => `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
  );
  const [turns, setTurns] = useState<Turn[]>([]);
  const [surfaces, setSurfaces] = useState<SurfaceMap>({});
  const [busy, setBusy] = useState(false);
  const [activity, setActivity] = useState<string | null>(null);
  const [pendingSurfaceId, setPendingSurfaceId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const transcriptRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    transcriptRef.current?.scrollTo({
      top: transcriptRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [turns, surfaces]);

  const appendTurn = useCallback((turn: Omit<Turn, 'id'>) => {
    const id = nextId();
    setTurns((current) => [...current, { ...turn, id }]);
    return id;
  }, []);

  const send = useCallback(
    async (payload: { message?: string; action?: ActionMessage['action'] }, label: string, role: Turn['role']) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      setActivity(null);

      appendTurn({ role, text: label, surfaceIds: [] });
      const assistantId = appendTurn({ role: 'assistant', text: '', surfaceIds: [] });

      const appendText = (delta: string) =>
        setTurns((current) =>
          current.map((turn) =>
            turn.id === assistantId ? { ...turn, text: turn.text + delta } : turn,
          ),
        );

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, ...payload }),
        });
        if (!response.ok || !response.body) {
          const detail = await response.json().catch(() => ({ error: response.statusText }));
          throw new Error(detail.error ?? 'The agent could not be reached.');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const frames = buffer.split('\n\n');
          buffer = frames.pop() ?? '';

          for (const frame of frames) {
            const line = frame.split('\n').find((entry) => entry.startsWith('data: '));
            if (!line) continue;
            const event = JSON.parse(line.slice(6));

            switch (event.type) {
              case 'text':
                appendText(event.text);
                break;
              case 'tool':
                setActivity(
                  event.phase === 'start'
                    ? `${event.name}${event.detail ? ` · ${event.detail}` : ''}`
                    : null,
                );
                break;
              case 'a2ui': {
                const messages = event.messages as AgentToRendererMessage[];
                setSurfaces((current) => {
                  let next = current;
                  for (const message of messages) next = applyMessage(next, message).surfaces;
                  return next;
                });
                const created = messages.filter(isCreateSurface).map((m) => m.createSurface.surfaceId);
                if (created.length) {
                  setTurns((current) =>
                    current.map((turn) =>
                      turn.id === assistantId
                        ? { ...turn, surfaceIds: [...turn.surfaceIds, ...created] }
                        : turn,
                    ),
                  );
                }
                break;
              }
              case 'error':
                appendTurn({ role: 'error', text: event.message, surfaceIds: [] });
                break;
              default:
                break;
            }
          }
        }
      } catch (error) {
        appendTurn({
          role: 'error',
          text: error instanceof Error ? error.message : String(error),
          surfaceIds: [],
        });
      } finally {
        // Drop the assistant turn if it produced neither text nor a widget.
        setTurns((current) =>
          current.filter(
            (turn) => turn.id !== assistantId || turn.text.trim() !== '' || turn.surfaceIds.length > 0,
          ),
        );
        setActivity(null);
        setPendingSurfaceId(null);
        setBusy(false);
        busyRef.current = false;
      }
    },
    [appendTurn, sessionId],
  );

  const submitMessage = useCallback(
    (message: string) => {
      const trimmed = message.trim();
      if (!trimmed) return;
      setDraft('');
      void send({ message: trimmed }, trimmed, 'user');
    },
    [send],
  );

  /** A button inside a widget fired an event: dispatch it as a renderer-to-agent action. */
  const handleEvent = useCallback(
    (surfaceId: string, event: SurfaceEvent) => {
      if (busyRef.current) return;
      const action: ActionMessage['action'] = {
        name: event.name,
        surfaceId,
        sourceComponentId: event.sourceComponentId,
        timestamp: new Date().toISOString(),
        context: event.context,
        userMessage: event.userMessage,
      };
      setPendingSurfaceId(surfaceId);
      void send(
        { action },
        event.userMessage ?? `${event.name} · ${surfaceId}`,
        'action',
      );
    },
    [send],
  );

  /** Two-way binding: the renderer writes user input straight into the model. */
  const handleWrite = useCallback((surfaceId: string, path: string, value: unknown) => {
    setSurfaces((current) => {
      const surface = current[surfaceId];
      if (!surface) return current;
      return {
        ...current,
        [surfaceId]: {
          ...surface,
          dataModel: setAtPointer(surface.dataModel, path, value) as Record<string, unknown>,
        },
      };
    });
  }, []);

  const protocolLabel = useMemo(() => `A2UI ${A2UI_VERSION}`, []);

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <h1 className="app__title">Gen-UI · agent-rendered chat</h1>
          <p className="app__subtitle">
            {protocolLabel} · widgets composed from the design-system catalog
          </p>
        </div>
        <span className="app__mode" data-live={live}>
          {live ? 'live agent' : 'scripted agent (no API key)'}
        </span>
      </header>

      <div className="transcript" ref={transcriptRef}>
        {turns.length === 0 ? (
          <div className="empty">
            <strong>Ask about a GitHub repository.</strong>
            The agent fetches live data, then decides whether to answer in prose or to render an
            interactive widget. Its buttons come back here as protocol events and refresh the widget
            in place.
          </div>
        ) : null}

        {turns.map((turn) => (
          <div className="turn" data-role={turn.role} key={turn.id}>
            {turn.text ? (
              <div className="bubble">
                <InlineMarkdown text={turn.text} />
              </div>
            ) : null}
            {turn.surfaceIds.map((surfaceId) => {
              const surface = surfaces[surfaceId];
              if (!surface) return null;
              return (
                <div className="surface" key={surfaceId}>
                  <div className="surface__meta">
                    <span
                      className="surface__dot"
                      data-pending={pendingSurfaceId === surfaceId}
                    />
                    surface {surfaceId} · rev {surface.revision}
                  </div>
                  <SurfaceRenderer
                    surface={surface}
                    pending={pendingSurfaceId === surfaceId || (busy && pendingSurfaceId === null)}
                    onEvent={(event) => handleEvent(surfaceId, event)}
                    onWrite={(path, value) => handleWrite(surfaceId, path, value)}
                    onError={(error) =>
                      appendTurn({ role: 'error', text: error.message, surfaceIds: [] })
                    }
                  />
                </div>
              );
            })}
          </div>
        ))}

        {activity ? (
          <div className="activity">
            <span className="ds-spinner__dot" />
            {activity}
          </div>
        ) : null}
      </div>

      {turns.length === 0 ? (
        <div className="suggestions">
          {SUGGESTIONS.map((suggestion) => (
            <button
              type="button"
              className="suggestion"
              key={suggestion}
              onClick={() => submitMessage(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}

      <form
        className="composer"
        onSubmit={(formEvent) => {
          formEvent.preventDefault();
          submitMessage(draft);
        }}
      >
        <input
          className="composer__input"
          value={draft}
          placeholder="Ask about a repository…"
          onChange={(inputEvent) => setDraft(inputEvent.target.value)}
          disabled={busy}
        />
        <button type="submit" className="ds-button" data-variant="primary" disabled={busy || !draft.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
