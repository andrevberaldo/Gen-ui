/**
 * The agent loop.
 *
 * A manual streaming loop rather than the SDK tool runner, because this app has
 * to interleave three kinds of output on one wire: assistant text, tool
 * progress, and A2UI messages that must reach the renderer the moment they are
 * validated rather than at the end of the turn.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { AgentToRendererMessage } from '../a2ui/protocol/types';
import type { Session } from '../server/sessions';
import { touch } from '../server/sessions';
import { systemPrompt } from './prompt';
import { runTool, tools } from './tools';

export type AgentEvent =
  | { type: 'text'; text: string }
  | { type: 'a2ui'; messages: AgentToRendererMessage[] }
  | { type: 'tool'; name: string; phase: 'start' | 'end'; detail?: string }
  | { type: 'error'; message: string }
  | { type: 'done' };

export const DEFAULT_MODEL = 'claude-opus-5';

/** Guards against a tool loop that never settles. */
const MAX_ITERATIONS = 8;

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) client = new Anthropic();
  return client;
}

export function isAgentConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

export async function* runAgent(session: Session, userMessage: string): AsyncGenerator<AgentEvent> {
  session.messages.push({ role: 'user', content: userMessage });
  touch(session);

  const anthropic = getClient();
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration += 1) {
    let message: Anthropic.Message;
    try {
      const stream = anthropic.messages.stream({
        model,
        max_tokens: 16000,
        system: systemPrompt,
        tools,
        messages: session.messages,
      });

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          yield { type: 'text', text: event.delta.text };
        }
      }
      message = await stream.finalMessage();
    } catch (error) {
      yield { type: 'error', message: describeError(error) };
      return;
    }

    session.messages.push({ role: 'assistant', content: message.content });
    touch(session);

    if (message.stop_reason === 'refusal') {
      yield { type: 'error', message: 'The model declined to answer this request.' };
      return;
    }

    if (message.stop_reason !== 'tool_use') {
      yield { type: 'done' };
      return;
    }

    const toolUses = message.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
    );
    const results: Anthropic.ToolResultBlockParam[] = [];

    for (const toolUse of toolUses) {
      yield { type: 'tool', name: toolUse.name, phase: 'start', detail: describeInput(toolUse) };

      const emitted: AgentToRendererMessage[][] = [];
      const outcome = await runTool(toolUse.name, (toolUse.input ?? {}) as Record<string, unknown>, {
        session,
        emit: (messages) => emitted.push(messages),
      });

      for (const messages of emitted) {
        yield { type: 'a2ui', messages };
      }
      yield {
        type: 'tool',
        name: toolUse.name,
        phase: 'end',
        detail: outcome.isError ? 'failed' : undefined,
      };

      results.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: outcome.content,
        is_error: outcome.isError,
      });
    }

    session.messages.push({ role: 'user', content: results });
    touch(session);
  }

  yield {
    type: 'error',
    message: `Stopped after ${MAX_ITERATIONS} tool rounds without a final answer.`,
  };
}

function describeInput(toolUse: Anthropic.ToolUseBlock): string | undefined {
  const input = (toolUse.input ?? {}) as Record<string, unknown>;
  for (const key of ['repo', 'query', 'location']) {
    if (typeof input[key] === 'string') return input[key] as string;
  }
  if (toolUse.name === 'render_ui' && Array.isArray(input.messages)) {
    return `${input.messages.length} message${input.messages.length === 1 ? '' : 's'}`;
  }
  return undefined;
}

function describeError(error: unknown): string {
  if (error instanceof Anthropic.AuthenticationError) {
    return 'Anthropic rejected the API key. Check ANTHROPIC_API_KEY in .env.local.';
  }
  if (error instanceof Anthropic.RateLimitError) {
    return 'Rate limited by the Anthropic API. Try again in a moment.';
  }
  if (error instanceof Anthropic.APIError) {
    return `Anthropic API error ${error.status ?? ''}: ${error.message}`.trim();
  }
  return error instanceof Error ? error.message : String(error);
}
