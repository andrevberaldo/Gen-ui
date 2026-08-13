/**
 * In-memory session store.
 *
 * A session holds two things: the conversation the model sees, and a mirror of
 * the surfaces the renderer currently holds. The mirror is what allows the
 * agent to send incremental updates — it can be told which surfaces and
 * component ids actually exist before its message is accepted.
 *
 * A POC deliberately keeps this in process memory; swapping it for Redis or a
 * database changes nothing above it.
 */

import type Anthropic from '@anthropic-ai/sdk';
import type { SurfaceMap } from '../a2ui/runtime/surface';

export interface Session {
  id: string;
  messages: Anthropic.MessageParam[];
  surfaces: SurfaceMap;
  createdAt: number;
  updatedAt: number;
}

const sessions = new Map<string, Session>();

/** Sessions idle for longer than this are dropped. */
const TTL_MS = 60 * 60 * 1000;

function sweep(): void {
  const cutoff = Date.now() - TTL_MS;
  for (const [id, session] of sessions) {
    if (session.updatedAt < cutoff) sessions.delete(id);
  }
}

export function getSession(id: string): Session {
  sweep();
  const existing = sessions.get(id);
  if (existing) return existing;
  const session: Session = {
    id,
    messages: [],
    surfaces: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  sessions.set(id, session);
  return session;
}

export function touch(session: Session): void {
  session.updatedAt = Date.now();
}

export function resetSession(id: string): void {
  sessions.delete(id);
}
