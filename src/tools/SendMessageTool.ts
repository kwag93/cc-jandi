import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { JandiService } from "../services/jandiService.js";
import { ConfigService } from "../services/configService.js";

interface SendMessageInput {
  message: string;
  token?: string;
  tokenAlias?: string;
}

class SendMessageTool extends MCPTool<SendMessageInput> {
  name = "send_message";
  description = "Send a basic text message to Jandi via webhook";

  schema = {
    message: {
      type: z.string(),
      description: "The message text to send to Jandi",
    },
    token: {
      type: z.string().optional(),
      description: "Jandi webhook token (32-character hexadecimal string). If not provided, will use tokenAlias or default token",
    },
    tokenAlias: {
      type: z.string().optional(),
      description: "Token alias from configuration (e.g., 'default', 'dev', 'prod'). If not provided, will use 'default'",
    },
  };

  async execute(input: SendMessageInput) {
    try {
      let config;

      // Determine which token to use
      if (input.token) {
        // Validate token format
        if (!ConfigService.validateTokenFormat(input.token)) {
          return {
            success: false,
            error: "Invalid token format. Token should be a 32-character hexadecimal string"
          };
        }
        config = { token: input.token };
      } else if (input.tokenAlias) {
        config = ConfigService.getToken(input.tokenAlias);
        if (!config) {
          return {
            success: false,
            error: `Token alias '${input.tokenAlias}' not found. Available aliases: ${ConfigService.listTokenAliases().join(', ')}`
          };
        }
      } else {
        config = ConfigService.getToken('default');
        if (!config) {
          return {
            success: false,
            error: "No default token configured. Please provide a token or tokenAlias, or set JANDI_TOKEN environment variable"
          };
        }
      }

      // Create basic message
      const message = JandiService.createBasicMessage(input.message);

      // Send message
      const result = await JandiService.sendMessage(config, message);

      if (result.success) {
        return {
          success: true,
          message: "Message sent successfully to Jandi",
          tokenUsed: config.alias || 'direct'
        };
      } else {
        return {
          success: false,
          error: result.error
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Unexpected error: ${error}`
      };
    }
  }
}

export default SendMessageTool;