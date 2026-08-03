import { BaseJandiMessage } from './common.js';

export interface OutgoingWebhookPayload {
  token: string;
  teamName: string;
  roomName: string;
  writerName: string;
  writerEmail: string;
  /** Full message text, including the trigger keyword. */
  text: string;
  keyword: string;
  createdAt: string;
  /** Message text with the trigger keyword stripped. */
  data?: string;
  platform?: 'web' | 'ios' | 'android';
  ip?: string;
}

export interface TeamOutgoingWebhookPayload {
  token: string;
  teamName: string;
  roomName: string;
  writer: {
    id: string;
    name: string;
    email: string;
    phoneNumber?: string;
  };
  /** Full message text, including the trigger keyword. */
  text: string;
  keyword: string;
  createdAt: string;
  /** Message text with the trigger keyword stripped. */
  data?: string;
  platform?: 'web' | 'ios' | 'android';
  ip?: string;
}

export interface OutgoingWebhookResponse extends BaseJandiMessage {}
