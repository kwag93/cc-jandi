import { BaseWebhookConfig, BaseJandiMessage, BaseJandiResponse } from './common.js';

export interface IncomingWebhookConfig extends BaseWebhookConfig {
  type?: 'incoming';
}

export interface IncomingMessage extends BaseJandiMessage {}

export interface IncomingResponse extends BaseJandiResponse {}
