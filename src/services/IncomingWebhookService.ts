import { BaseWebhookService } from './base/BaseWebhookService.js';
import { IncomingWebhookConfig, IncomingMessage, IncomingResponse } from '../types/incoming.js';
import { JandiConnectInfo, JandiColors, MessageType } from '../types/common.js';

export class IncomingWebhookService extends BaseWebhookService {
  private static readonly DEFAULT_URL = 'https://wh.jandi.com/connect-api/webhook';

  protected buildUrl(config: IncomingWebhookConfig): string {
    return IncomingWebhookService.getWebhookUrl(config);
  }

  private static getWebhookUrl(config: IncomingWebhookConfig): string {
    if (config.url) {
      return config.url;
    }
    return `${this.DEFAULT_URL}/${config.token}`;
  }

  public static async sendMessage(
    config: IncomingWebhookConfig,
    message: IncomingMessage
  ): Promise<IncomingResponse> {
    const url = this.getWebhookUrl(config);
    return this.sendRequest<IncomingMessage, IncomingResponse>(url, message);
  }

  public static async validateToken(token: string, customUrl?: string): Promise<IncomingResponse> {
    const testMessage: IncomingMessage = {
      body: 'Token validation test message',
      connectColor: JandiColors.GRAY
    };

    const config: IncomingWebhookConfig = { token, url: customUrl };

    try {
      const result = await this.sendMessage(config, testMessage);

      if (result.success) {
        return {
          success: true,
          message: 'Token is valid'
        };
      } else {
        return {
          success: false,
          error: `Token validation failed: ${result.error}`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Token validation error: ${error}`
      };
    }
  }

  public static createBasicMessage(body: string): IncomingMessage {
    return { body };
  }

  public static createRichMessage(
    body: string,
    color?: string,
    connectInfo?: JandiConnectInfo[]
  ): IncomingMessage {
    return {
      body,
      connectColor: color || JandiColors.DEFAULT,
      connectInfo
    };
  }

  public static createStatusMessage(
    body: string,
    type: MessageType,
    additionalInfo?: string
  ): IncomingMessage {
    const colorMap = {
      [MessageType.INFO]: JandiColors.BLUE,
      [MessageType.SUCCESS]: JandiColors.GREEN,
      [MessageType.WARNING]: JandiColors.YELLOW,
      [MessageType.ERROR]: JandiColors.RED
    };

    const message: IncomingMessage = {
      body,
      connectColor: colorMap[type]
    };

    if (additionalInfo) {
      message.connectInfo = [{
        title: type.toUpperCase(),
        description: additionalInfo
      }];
    }

    return message;
  }
}
