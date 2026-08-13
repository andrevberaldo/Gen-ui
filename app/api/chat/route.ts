/**
 * The transport.
 *
 * A2UI is transport-agnostic; this POC uses plain SSE over POST. Both a typed
 * user message and a renderer-dispatched action enter the agent here, which is
 * the point: to the agent an action is just another turn in the conversation.
 */

import { NextRequest } from 'next/server';
import type { ActionMessage } from '../../../src/a2ui/protocol/types';
import { isAgentConfigured, runAgent, type AgentEvent } from '../../../src/agent/runAgent';
import { runMockAgent } from '../../../src/agent/mockAgent';
import { getSession } from '../../../src/server/sessions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ChatRequest {
  sessionId?: string;
  message?: string;
  action?: ActionMessage['action'];
}

export async function POST(request: NextRequest) {
  let body: ChatRequest;
  try {
    body = (await request.json()) as ChatRequest;
  } catch {
    return Response.json({ error: 'Expected a JSON body.' }, { status: 400 });
  }

  const sessionId = body.sessionId?.trim();
  if (!sessionId) return Response.json({ error: 'sessionId is required.' }, { status: 400 });

  const turn = body.action ? formatAction(body.action) : body.message?.trim();
  if (!turn) return Response.json({ error: 'Provide a message or an action.' }, { status: 400 });

  const session = getSession(sessionId);
  const events: AsyncGenerator<AgentEvent> = isAgentConfigured()
    ? runAgent(session, turn)
    : runMockAgent(session, turn);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: AgentEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };
      try {
        for await (const event of events) send(event);
      } catch (error) {
        send({ type: 'error', message: error instanceof Error ? error.message : String(error) });
      } finally {
        send({ type: 'done' });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

/**
 * Renders a renderer-to-agent action as the hidden user turn the agent reads.
 * The shape is stable so the agent can switch on the event name.
 */
function formatAction(action: ActionMessage['action']): string {
  return [
    `[a2ui action] name=${action.name}`,
    `surface=${action.surfaceId}`,
    `component=${action.sourceComponentId}`,
    `context=${JSON.stringify(action.context ?? {})}`,
  ].join(' ');
}
