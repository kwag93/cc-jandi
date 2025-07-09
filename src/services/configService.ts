import * as dotenv from 'dotenv';
import { JandiWebhookConfig } from '../types/jandi.js';

dotenv.config();

export class ConfigService {
  private static tokens: Map<string, JandiWebhookConfig> = new Map();

  public static initialize(): void {
    // Load default token
    const defaultToken = process.env.JANDI_TOKEN;
    if (defaultToken) {
      this.addToken('default', defaultToken);
    }

    // Load named tokens (JANDI_TOKEN_DEV, JANDI_TOKEN_PROD, etc.)
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('JANDI_TOKEN_') && key !== 'JANDI_TOKEN') {
        const alias = key.replace('JANDI_TOKEN_', '').toLowerCase();
        const token = process.env[key];
        if (token) {
          this.addToken(alias, token);
        }
      }
    });

    // Load custom URLs
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('JANDI_URL_')) {
        const alias = key.replace('JANDI_URL_', '').toLowerCase();
        const url = process.env[key];
        if (url && this.tokens.has(alias)) {
          const config = this.tokens.get(alias)!;
          config.url = url;
        }
      }
    });
  }

  public static addToken(alias: string, token: string, url?: string): void {
    this.tokens.set(alias, {
      token,
      url,
      alias
    });
  }

  public static getToken(alias: string): JandiWebhookConfig | null {
    return this.tokens.get(alias) || null;
  }

  public static getAllTokens(): Map<string, JandiWebhookConfig> {
    return new Map(this.tokens);
  }

  public static hasToken(alias: string): boolean {
    return this.tokens.has(alias);
  }

  public static removeToken(alias: string): boolean {
    return this.tokens.delete(alias);
  }

  public static getTokenByValue(tokenValue: string): JandiWebhookConfig | null {
    for (const [alias, config] of this.tokens) {
      if (config.token === tokenValue) {
        return config;
      }
    }
    return null;
  }

  public static validateTokenFormat(token: string): boolean {
    // 잔디 토큰은 일반적으로 32자 길이의 hexadecimal 문자열
    const tokenRegex = /^[a-f0-9]{32}$/i;
    return tokenRegex.test(token);
  }

  public static listTokenAliases(): string[] {
    return Array.from(this.tokens.keys());
  }
}