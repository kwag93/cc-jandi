import axios, { AxiosError } from 'axios';
import { JandiMessage, JandiWebhookConfig, JandiResponse, JandiColors, MessageType } from '../types/jandi';

export class JandiService {
  private static readonly DEFAULT_URL = 'https://wh.jandi.com/connect-api/webhook';
  private static readonly HEADERS = {
    'Accept': 'application/vnd.tosslab.jandi-v2+json',
    'Content-Type': 'application/json'
  };

  // Jandi limits
  private static readonly MAX_MESSAGE_LENGTH = 5000;
  private static readonly MAX_DATA_SIZE = 256 * 1024; // 256KB

  private static getWebhookUrl(token: string, customUrl?: string): string {
    if (customUrl) {
      return customUrl;
    }
    return `${this.DEFAULT_URL}/${token}`;
  }

  private static validateMessageLimits(message: JandiMessage): { valid: boolean; error?: string } {
    // Check message length
    if (message.body.length > this.MAX_MESSAGE_LENGTH) {
      return {
        valid: false,
        error: `Message body exceeds maximum length of ${this.MAX_MESSAGE_LENGTH} characters (current: ${message.body.length})`
      };
    }

    // Check total data size
    const dataSize = JSON.stringify(message).length;
    if (dataSize > this.MAX_DATA_SIZE) {
      return {
        valid: false,
        error: `Message data exceeds maximum size of ${this.MAX_DATA_SIZE} bytes (current: ${dataSize})`
      };
    }

    return { valid: true };
  }

  private static handleJandiError(error: AxiosError): { error: string; errorCode?: number; rateLimited?: boolean } {
    if (error.response?.status === 429) {
      return {
        error: 'Rate limit exceeded. Jandi allows 60 requests/min and 500 requests/10min. Please wait and try again.',
        errorCode: 42900,
        rateLimited: true
      };
    }

    if (error.response?.status === 400) {
      const data = error.response.data as any;
      if (data?.code === 40000) {
        return {
          error: 'Invalid webhook token format or inactive/deleted webhook',
          errorCode: 40000
        };
      }
      return {
        error: 'Invalid request data format',
        errorCode: 40000
      };
    }

    return {
      error: error.message || 'Unknown error occurred'
    };
  }

  public static async sendMessage(
    config: JandiWebhookConfig,
    message: JandiMessage
  ): Promise<JandiResponse> {
    try {
      // Validate message limits
      const validation = this.validateMessageLimits(message);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error!
        };
      }

      const url = this.getWebhookUrl(config.token, config.url);
      
      const response = await axios.post(url, message, {
        headers: this.HEADERS,
        timeout: 10000 // 10 seconds timeout
      });

      return {
        success: true,
        message: 'Message sent successfully'
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      const errorInfo = this.handleJandiError(axiosError);
      
      return {
        success: false,
        error: errorInfo.error,
        errorCode: errorInfo.errorCode,
        rateLimited: errorInfo.rateLimited
      };
    }
  }

  public static async validateToken(token: string): Promise<JandiResponse> {
    const testMessage: JandiMessage = {
      body: 'Token validation test message',
      connectColor: JandiColors.GRAY
    };

    const config: JandiWebhookConfig = { token };
    
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

  public static createBasicMessage(body: string): JandiMessage {
    return { body };
  }

  public static createRichMessage(
    body: string,
    color?: string,
    connectInfo?: Array<{ title?: string; description?: string; imageUrl?: string }>
  ): JandiMessage {
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
  ): JandiMessage {
    const colorMap = {
      [MessageType.INFO]: JandiColors.BLUE,
      [MessageType.SUCCESS]: JandiColors.GREEN,
      [MessageType.WARNING]: JandiColors.YELLOW,
      [MessageType.ERROR]: JandiColors.RED
    };

    const message: JandiMessage = {
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