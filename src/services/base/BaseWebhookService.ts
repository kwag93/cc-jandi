import axios, { AxiosError } from 'axios';
import { BaseJandiMessage, BaseJandiResponse, BaseWebhookConfig, JandiErrorCodes } from '../../types/common.js';

/** Error body Jandi returns with an HTTP 400. */
interface JandiErrorBody {
  code?: number;
  msg?: string;
  data?: {
    errors?: {
      path?: string;
      msg?: string;
    };
  };
}

export abstract class BaseWebhookService {
  protected static readonly HEADERS = {
    'Accept': 'application/vnd.tosslab.jandi-v2+json',
    'Content-Type': 'application/json'
  };

  protected static readonly MAX_MESSAGE_LENGTH = 5000;
  protected static readonly MAX_DATA_SIZE = 256 * 1024; // 256KB
  protected static readonly REQUEST_TIMEOUT = 10000; // 10 seconds
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAYS = [5000, 15000, 30000]; // ms — Jandi rate limit is 60 req/min

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
    const status = error.response?.status;

    if (status === 429) {
      return {
        error: 'Rate limit exceeded. Jandi allows 60 requests/min and 500 requests/10min. Please wait and try again.',
        errorCode: JandiErrorCodes.RATE_LIMITED,
        rateLimited: true
      };
    }

    // Jandi's gateway refuses a path it cannot match at all, which in practice means
    // the token is missing the team id segment that precedes it.
    if (status === 403) {
      return {
        error: 'Webhook rejected with 403 Forbidden. The token must contain both segments Jandi issues, as in "12345678/abcdef0123456789abcdef0123456789".'
      };
    }

    if (status === 400) {
      const body = error.response?.data as JandiErrorBody | undefined;
      const code = typeof body?.code === 'number' ? body.code : undefined;

      if (code === JandiErrorCodes.INVALID_TOKEN) {
        return {
          error: 'Invalid webhook token, or the webhook has been disabled or deleted',
          errorCode: code
        };
      }

      // Name the offending field when Jandi identifies one, but never echo `value` —
      // it can carry the token itself.
      const field = body?.data?.errors?.path;
      const detail = [body?.msg, field && `field: ${field}`].filter(Boolean).join(', ');
      return {
        error: detail ? `Jandi rejected the request (${detail})` : 'Jandi rejected the request',
        errorCode: code
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

    let lastResult: TResponse = { success: false, error: 'Max retries exceeded' } as TResponse;

    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        await this.sleep(this.RETRY_DELAYS[attempt - 1]);
      }

      try {
        const response = await axios.post(url, message, {
          headers: this.HEADERS,
          timeout: this.REQUEST_TIMEOUT
        });

        // Team Incoming returns { validEmails, invalidEmails }; merge it through
        // so callers can report which recipients were actually delivered to.
        const body = typeof response.data === 'object' && response.data !== null
          ? response.data as Record<string, unknown>
          : {};

        return { ...body, success: true, message: 'Message sent successfully' } as TResponse;
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

    return lastResult;
  }

  protected abstract buildUrl(config: BaseWebhookConfig): string;
}
