import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { JandiService } from "../services/jandiService.js";
import { ConfigService } from "../services/configService.js";

interface ValidateTokenInput {
  token?: string;
  tokenAlias?: string;
}

class ValidateTokenTool extends MCPTool<ValidateTokenInput> {
  name = "validate_token";
  description = "Validate a Jandi webhook token by sending a test message";

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
      let tokenToValidate: string;
      let aliasUsed: string;

      // Determine which token to validate
      if (input.token) {
        // Validate token format first
        if (!ConfigService.validateTokenFormat(input.token)) {
          return {
            success: false,
            error: "Invalid token format. Token should be a 32-character hexadecimal string",
            tokenFormat: "invalid"
          };
        }
        tokenToValidate = input.token;
        aliasUsed = 'direct';
      } else if (input.tokenAlias) {
        const config = ConfigService.getToken(input.tokenAlias);
        if (!config) {
          return {
            success: false,
            error: `Token alias '${input.tokenAlias}' not found. Available aliases: ${ConfigService.listTokenAliases().join(', ')}`
          };
        }
        tokenToValidate = config.token;
        aliasUsed = input.tokenAlias;
      } else {
        const config = ConfigService.getToken('default');
        if (!config) {
          return {
            success: false,
            error: "No default token configured. Please provide a token or tokenAlias, or set JANDI_TOKEN environment variable"
          };
        }
        tokenToValidate = config.token;
        aliasUsed = 'default';
      }

      // Validate token
      const result = await JandiService.validateToken(tokenToValidate);

      if (result.success) {
        return {
          success: true,
          message: "Token is valid and webhook is working",
          tokenAlias: aliasUsed,
          tokenFormat: "valid"
        };
      } else {
        return {
          success: false,
          error: result.error,
          tokenAlias: aliasUsed,
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