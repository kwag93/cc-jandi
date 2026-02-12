// Common types
export {
  JandiConnectInfo,
  BaseJandiMessage,
  BaseJandiResponse,
  BaseWebhookConfig,
  WebhookType,
  JandiColors,
  MessageType,
  ScriptTemplate,
} from './common.js';

// Incoming webhook types
export {
  IncomingWebhookConfig,
  IncomingMessage,
  IncomingResponse,
} from './incoming.js';

// Team incoming webhook types
export {
  TeamIncomingWebhookConfig,
  TeamIncomingMessage,
  TeamIncomingResponse,
} from './team-incoming.js';

// Outgoing webhook types
export {
  OutgoingWebhookPayload,
  TeamOutgoingWebhookPayload,
  OutgoingWebhookResponse,
} from './outgoing.js';

// Backward compatibility aliases
export type { IncomingWebhookConfig as JandiWebhookConfig } from './incoming.js';
export type { IncomingMessage as JandiMessage } from './incoming.js';
export type { IncomingResponse as JandiResponse } from './incoming.js';
