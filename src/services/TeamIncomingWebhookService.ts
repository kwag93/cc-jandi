import { BaseWebhookService } from './base/BaseWebhookService.js';
import { TeamIncomingWebhookConfig, TeamIncomingMessage, TeamIncomingResponse } from '../types/team-incoming.js';
import { BaseJandiMessage, JandiConnectInfo, JandiColors } from '../types/common.js';

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

    // Jandi Team Incoming Webhook uses 'to' field instead of 'email'
    const payload: BaseJandiMessage & { to: string } = {
      body: message.body,
      connectColor: message.connectColor,
      connectInfo: message.connectInfo,
      to: message.email
    };

    return this.sendRequest<BaseJandiMessage, TeamIncomingResponse>(url, payload);
  }

  public static async validateToken(config: TeamIncomingWebhookConfig): Promise<TeamIncomingResponse> {
    const testMessage: TeamIncomingMessage = {
      body: 'Team webhook token validation test',
      connectColor: JandiColors.GRAY,
      email: ''
    };

    // For validation, we send a minimal request to check if the endpoint responds
    const url = this.getWebhookUrl(config);

    try {
      const result = await this.sendRequest<TeamIncomingMessage, TeamIncomingResponse>(url, {
        body: testMessage.body,
        connectColor: testMessage.connectColor
      } as TeamIncomingMessage);

      // Even if the message fails due to missing email, a 400 vs 401/403 tells us token validity
      if (result.success) {
        return { success: true, message: 'Team webhook token is valid' };
      } else if (result.errorCode === 40000) {
        return { success: false, error: `Team webhook token validation failed: ${result.error}` };
      } else {
        // Non-auth errors might mean the token is valid but request was incomplete
        return { success: true, message: 'Team webhook token appears valid (endpoint reachable)' };
      }
    } catch (error) {
      return {
        success: false,
        error: `Team token validation error: ${error}`
      };
    }
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
