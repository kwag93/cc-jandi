export interface JandiConnectInfo {
  title?: string;
  description?: string;
  imageUrl?: string;
}

export interface JandiMessage {
  body: string;
  connectColor?: string;
  connectInfo?: JandiConnectInfo[];
}

export interface JandiWebhookConfig {
  token: string;
  url?: string;
  alias?: string;
}

export interface JandiResponse {
  success: boolean;
  message?: string;
  error?: string;
  errorCode?: number;
  rateLimited?: boolean;
}

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