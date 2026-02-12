import { BaseJandiMessage } from './common.js';

export interface OutgoingWebhookPayload {
  token: string;
  teamName: string;
  roomName: string;
  writerName: string;
  writerEmail: string;
  text: string;
  keyword: string;
  createdAt: string;
  data?: Record<string, unknown>;
  platform?: string;
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
  text: string;
  keyword: string;
  createdAt: string;
  data?: Record<string, unknown>;
  platform?: string;
  ip?: string;
}

export interface OutgoingWebhookResponse extends BaseJandiMessage {}
