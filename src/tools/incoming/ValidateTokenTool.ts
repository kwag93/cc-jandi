import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { IncomingWebhookService } from "../../services/IncomingWebhookService.js";
import { resolveIncomingToken } from "../../utils/resolveToken.js";

interface ValidateTokenInput {
  token?: string;
  tokenAlias?: string;
}

class ValidateTokenTool extends MCPTool<ValidateTokenInput> {
  name = "validate_token";
  description = "Validate a Jandi Incoming Webhook token by sending a test message";

  schema = {
    token: {
      type: z.string().optional(),
      description: "Jandi webhook token to validate (32-character hexadecimal string). If not provided, will use tokenAlias or default token",
    },
    tokenAlias: {
      type: z.string().optional(),
      description: "Token alias from configuration to validate (e.g., 'default', 'dev', 'prod'). If not provided, will use 'default'",
    },
  };

  async execute(input: ValidateTokenInput) {
    try {
      const resolved = resolveIncomingToken(input);
      if (!resolved.success) {
        return { success: false, error: resolved.error, tokenFormat: "invalid" };
      }

      const result = await IncomingWebhookService.validateToken(
        resolved.config.token,
        resolved.config.url
      );

      if (result.success) {
        return {
          success: true,
          message: "Token is valid and webhook is working",
          tokenAlias: resolved.config.alias || 'direct',
          tokenFormat: "valid"
        };
      } else {
        return {
          success: false,
          error: result.error,
          tokenAlias: resolved.config.alias || 'direct',
          tokenFormat: "valid_format_but_failed"
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Unexpected error during token validation: ${error}`
      };
    }
  }
}

export default ValidateTokenTool;
