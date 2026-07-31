export interface JandiConnectInfo {
  title?: string;
  description?: string;
  imageUrl?: string;
}

export interface BaseJandiMessage {
  body: string;
  connectColor?: string;
  connectInfo?: JandiConnectInfo[];
}

/**
 * Error codes returned by the Jandi Connect webhook API, verified against the live
 * endpoint in 2026-07. Jandi's public docs list the HTTP statuses but not the codes.
 */
export const JandiErrorCodes = {
  /** A request parameter failed validation — e.g. a non-numeric team id. */
  INVALID_VALUE: 40000,
  /** The webhook token is wrong, or the webhook is disabled or deleted. */
  INVALID_TOKEN: 40051,
  /** Rate limit exceeded (HTTP 429). */
  RATE_LIMITED: 42900,
} as const;

export interface BaseJandiResponse {
  success: boolean;
  message?: string;
  error?: string;
  errorCode?: number;
  rateLimited?: boolean;
}

export interface BaseWebhookConfig {
  token: string;
  url?: string;
  alias?: string;
}

export type WebhookType = 'incoming' | 'team-incoming' | 'outgoing' | 'team-outgoing';

export enum JandiColors {
  RED = '#FF0000',
  GREEN = '#00FF00',
  BLUE = '#0000FF',
  YELLOW = '#FFFF00',
  ORANGE = '#FFA500',
  PURPLE = '#800080',
  PINK = '#FFC0CB',
  GRAY = '#808080',
  DEFAULT = '#FAC11B'
}

export enum MessageType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error'
}

export interface ScriptTemplate {
  language: 'python' | 'nodejs' | 'curl' | 'bash';
  template: string;
  variables: { [key: string]: string };
}

export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: number;
}
