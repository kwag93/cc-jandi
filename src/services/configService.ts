import * as dotenv from 'dotenv';
import { IncomingWebhookConfig } from '../types/incoming.js';
import { TeamIncomingWebhookConfig } from '../types/team-incoming.js';

dotenv.config();

export class ConfigService {
  private static tokens: Map<string, IncomingWebhookConfig> = new Map();
  private static teamTokens: Map<string, TeamIncomingWebhookConfig> = new Map();
  private static outgoingTokens: Map<string, string> = new Map();

  public static initialize(): void {
    // Load default incoming token
    const defaultToken = process.env.JANDI_TOKEN;
    if (defaultToken) {
      this.addToken('default', defaultToken);
    }

    // Load named incoming tokens (JANDI_TOKEN_DEV, JANDI_TOKEN_PROD, etc.)
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('JANDI_TOKEN_') && key !== 'JANDI_TOKEN') {
        const alias = key.replace('JANDI_TOKEN_', '').toLowerCase();
        const token = process.env[key];
        if (token) {
          this.addToken(alias, token);
        }
      }
    });

    // Load custom URLs for incoming webhooks
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

    // Load team incoming tokens (JANDI_TEAM_ID_* + JANDI_TEAM_TOKEN_*)
    const teamAliases = new Set<string>();
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('JANDI_TEAM_ID_')) {
        teamAliases.add(key.replace('JANDI_TEAM_ID_', '').toLowerCase());
      }
      if (key.startsWith('JANDI_TEAM_TOKEN_')) {
        teamAliases.add(key.replace('JANDI_TEAM_TOKEN_', '').toLowerCase());
      }
    });

    teamAliases.forEach(alias => {
      const teamId = process.env[`JANDI_TEAM_ID_${alias.toUpperCase()}`];
      const token = process.env[`JANDI_TEAM_TOKEN_${alias.toUpperCase()}`];
      if (teamId && token) {
        const config: TeamIncomingWebhookConfig = { teamId, token, alias };
        const customUrl = process.env[`JANDI_TEAM_URL_${alias.toUpperCase()}`];
        if (customUrl) {
          config.url = customUrl;
        }
        this.teamTokens.set(alias, config);
      }
    });

    // Load outgoing verification tokens (JANDI_OUTGOING_TOKEN_*)
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('JANDI_OUTGOING_TOKEN_')) {
        const alias = key.replace('JANDI_OUTGOING_TOKEN_', '').toLowerCase();
        const token = process.env[key];
        if (token) {
          this.outgoingTokens.set(alias, token);
        }
      }
    });
  }

  // --- Incoming Token Management ---

  public static addToken(alias: string, token: string, url?: string): void {
    this.tokens.set(alias, {
      token,
      url,
      alias
    });
  }

  public static getToken(alias: string): IncomingWebhookConfig | null {
    return this.tokens.get(alias) || null;
  }

  public static getAllTokens(): Map<string, IncomingWebhookConfig> {
    return new Map(this.tokens);
  }

  public static hasToken(alias: string): boolean {
    return this.tokens.has(alias);
  }

  public static removeToken(alias: string): boolean {
    return this.tokens.delete(alias);
  }

  public static getTokenByValue(tokenValue: string): IncomingWebhookConfig | null {
    for (const [, config] of this.tokens) {
      if (config.token === tokenValue) {
        return config;
      }
    }
    return null;
  }

  /**
   * Jandi does not publish a token format, and real webhook addresses appear both
   * as a single token and as `{teamId}/{token}`. So accept anything usable as a URL
   * path segment and reject only what would break the request.
   */
  public static validateTokenFormat(token: string): boolean {
    return /^[A-Za-z0-9_\-/]+$/.test(token);
  }

  public static listTokenAliases(): string[] {
    return Array.from(this.tokens.keys());
  }

  // --- Team Incoming Token Management ---

  public static getTeamToken(alias: string): TeamIncomingWebhookConfig | null {
    return this.teamTokens.get(alias) || null;
  }

  public static hasTeamToken(alias: string): boolean {
    return this.teamTokens.has(alias);
  }

  public static listTeamTokenAliases(): string[] {
    return Array.from(this.teamTokens.keys());
  }

  public static getAllTeamTokens(): Map<string, TeamIncomingWebhookConfig> {
    return new Map(this.teamTokens);
  }

  // --- Outgoing Token Management ---

  public static getOutgoingToken(alias: string): string | null {
    return this.outgoingTokens.get(alias) || null;
  }

  public static hasOutgoingToken(alias: string): boolean {
    return this.outgoingTokens.has(alias);
  }

  public static listOutgoingTokenAliases(): string[] {
    return Array.from(this.outgoingTokens.keys());
  }
}
