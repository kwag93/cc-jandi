import axios, { AxiosError } from 'axios';
import { BaseJandiMessage, BaseJandiResponse, BaseWebhookConfig } from '../../types/common.js';

export abstract class BaseWebhookService {
  protected static readonly HEADERS = {
    'Accept': 'application/vnd.tosslab.jandi-v2+json',
    'Content-Type': 'application/json'
  };

  protected static readonly MAX_MESSAGE_LENGTH = 5000;
  protected static readonly MAX_DATA_SIZE = 256 * 1024; // 256KB
  protected static readonly REQUEST_TIMEOUT = 10000; // 10 seconds
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAYS = [1000, 2000, 4000]; // ms

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected static validateMessageLimits(message: BaseJandiMessage): { valid: boolean; error?: string } {
    if (message.body.length > this.MAX_MESSAGE_LENGTH) {
      return {
        valid: false,
        error: `Message body exceeds maximum length of ${this.MAX_MESSAGE_LENGTH} characters (current: ${message.body.length})`
      };
    }

    const dataSize = JSON.stringify(message).length;
    if (dataSize > this.MAX_DATA_SIZE) {
      return {
        valid: false,
        error: `Message data exceeds maximum size of ${this.MAX_DATA_SIZE} bytes (current: ${dataSize})`
      };
    }

    return { valid: true };
  }

  protected static handleJandiError(error: AxiosError): { error: string; errorCode?: number; rateLimited?: boolean } {
    if (error.response?.status === 429) {
      return {
        error: 'Rate limit exceeded. Jandi allows 60 requests/min and 500 requests/10min. Please wait and try again.',
        errorCode: 42900,
        rateLimited: true
      };
    }

    if (error.response?.status === 400) {
      const data = error.response.data as Record<string, unknown>;
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

  protected static async sendRequest<TMessage extends BaseJandiMessage, TResponse extends BaseJandiResponse>(
    url: string,
    message: TMessage
  ): Promise<TResponse> {
    const validation = this.validateMessageLimits(message);
    if (!validation.valid) {
      return { success: false, error: validation.error! } as TResponse;
    }

    let lastResult: TResponse | undefined;

    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        await this.sleep(this.RETRY_DELAYS[attempt - 1]);
      }

      try {
        await axios.post(url, message, {
          headers: this.HEADERS,
          timeout: this.REQUEST_TIMEOUT
        });

        return { success: true, message: 'Message sent successfully' } as TResponse;
      } catch (error) {
        const axiosError = error as AxiosError;
        const errorInfo = this.handleJandiError(axiosError);

        lastResult = {
          success: false,
          error: errorInfo.error,
          errorCode: errorInfo.errorCode,
          rateLimited: errorInfo.rateLimited
        } as TResponse;

        // Only retry on rate limit errors
        if (!errorInfo.rateLimited) {
          return lastResult;
        }
      }
    }

    return lastResult!;
  }

  protected abstract buildUrl(config: BaseWebhookConfig): string;
}
