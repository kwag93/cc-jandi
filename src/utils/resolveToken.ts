import { ConfigService } from '../services/configService.js';
import { IncomingWebhookConfig } from '../types/incoming.js';

interface TokenInput {
  token?: string;
  tokenAlias?: string;
}

type ResolveResult =
  | { success: true; config: IncomingWebhookConfig }
  | { success: false; error: string };

export function resolveIncomingToken(input: TokenInput): ResolveResult {
  if (input.token) {
    if (!ConfigService.validateTokenFormat(input.token)) {
      return {
        success: false,
        error: "Invalid token format. Token should be a 32-character hexadecimal string"
      };
    }
    return { success: true, config: { token: input.token } };
  }

  if (input.tokenAlias) {
    const config = ConfigService.getToken(input.tokenAlias);
    if (!config) {
      return {
        success: false,
        error: `Token alias '${input.tokenAlias}' not found. Available aliases: ${ConfigService.listTokenAliases().join(', ')}`
      };
    }
    return { success: true, config };
  }

  const config = ConfigService.getToken('default');
  if (!config) {
    return {
      success: false,
      error: "No default token configured. Please provide a token or tokenAlias, or set JANDI_TOKEN environment variable"
    };
  }
  return { success: true, config };
}
