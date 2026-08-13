import { Chat } from '../src/chat/Chat';
import { isAgentConfigured } from '../src/agent/runAgent';

export default function Page() {
  return <Chat live={isAgentConfigured()} />;
}
