// Backward compatibility facade
// New code should import from './index.js' or specific type files
export {
  JandiConnectInfo,
  JandiColors,
  MessageType,
  ScriptTemplate,
} from './common.js';

export type { IncomingWebhookConfig as JandiWebhookConfig } from './incoming.js';
export type { IncomingMessage as JandiMessage } from './incoming.js';
export type { IncomingResponse as JandiResponse } from './incoming.js';
