import { BaseWebhookService } from './base/BaseWebhookService.js';
import { TeamIncomingWebhookConfig, TeamIncomingMessage, TeamIncomingResponse } from '../types/team-incoming.js';
import { JandiConnectInfo, JandiColors, JandiErrorCodes } from '../types/common.js';

export class TeamIncomingWebhookService extends BaseWebhookService {
  private static readonly DEFAULT_URL = 'https://wh.jandi.com/connect-api/team-webhook';
  private static readonly MAX_EMAIL_COUNT = 100;

  protected buildUrl(config: TeamIncomingWebhookConfig): string {
    return TeamIncomingWebhookService.getWebhookUrl(config);
  }

  private static getWebhookUrl(config: TeamIncomingWebhookConfig): string {
    if (config.url) {
      return config.url;
    }
    return `${this.DEFAULT_URL}/${config.teamId}/${config.token}`;
  }

  private static validateEmails(email: string): { valid: boolean; error?: string } {
    const emails = email.split(',').map(e => e.trim()).filter(e => e.length > 0);

    if (emails.length === 0) {
      return { valid: false, error: 'At least one email address is required' };
    }

    if (emails.length > this.MAX_EMAIL_COUNT) {
      return {
        valid: false,
        error: `Maximum ${this.MAX_EMAIL_COUNT} email addresses allowed (provided: ${emails.length})`
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emails.filter(e => !emailRegex.test(e));

    if (invalidEmails.length > 0) {
      return {
        valid: false,
        error: `Invalid email format: ${invalidEmails.join(', ')}`
      };
    }

    return { valid: true };
  }

  public static async sendMessage(
    config: TeamIncomingWebhookConfig,
    message: TeamIncomingMessage
  ): Promise<TeamIncomingResponse> {
    const emailValidation = this.validateEmails(message.email);
    if (!emailValidation.valid) {
      return {
        success: false,
        error: emailValidation.error!
      };
    }

    const url = this.getWebhookUrl(config);

    // Jandi rejects or ignores fields outside the documented set, so send only
    // email / body / connectColor / connectInfo and omit the empty ones.
    const payload: TeamIncomingMessage = {
      email: message.email,
      body: message.body
    };
    if (message.connectColor) payload.connectColor = message.connectColor;
    if (message.connectInfo) payload.connectInfo = message.connectInfo;

    return this.sendRequest<TeamIncomingMessage, TeamIncomingResponse>(url, payload);
  }

  public static async validateToken(config: TeamIncomingWebhookConfig): Promise<TeamIncomingResponse> {
    const url = this.getWebhookUrl(config);

    // Jandi offers no read-only validation endpoint, so omit the recipient: that gets
    // the token checked without delivering anything. A bad token answers INVALID_TOKEN,
    // while a good one is rejected for the missing email instead.
    const result = await this.sendRequest<TeamIncomingMessage, TeamIncomingResponse>(
      url,
      { body: 'Team webhook token validation' } as TeamIncomingMessage
    );

    if (result.errorCode === JandiErrorCodes.INVALID_TOKEN) {
      return { success: false, error: result.error, errorCode: result.errorCode };
    }

    if (result.success || result.errorCode === JandiErrorCodes.INVALID_VALUE) {
      return { success: true, message: 'Team webhook token is valid' };
    }

    return {
      success: false,
      error: `Could not determine token validity: ${result.error}`,
      errorCode: result.errorCode
    };
  }

  public static createBasicMessage(body: string, email: string): TeamIncomingMessage {
    return { body, email };
  }

  public static createRichMessage(
    body: string,
    email: string,
    color?: string,
    connectInfo?: JandiConnectInfo[]
  ): TeamIncomingMessage {
    return {
      body,
      email,
      connectColor: color || JandiColors.DEFAULT,
      connectInfo
    };
  }
}
