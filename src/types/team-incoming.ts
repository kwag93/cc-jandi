import { BaseWebhookConfig, BaseJandiMessage, BaseJandiResponse } from './common.js';

export interface TeamIncomingWebhookConfig extends BaseWebhookConfig {
  type?: 'team-incoming';
  teamId: string;
}

export interface TeamIncomingMessage extends BaseJandiMessage {
  email: string;
}

export interface TeamIncomingResponse extends BaseJandiResponse {
  validEmails?: string[];
  invalidEmails?: string[];
}
