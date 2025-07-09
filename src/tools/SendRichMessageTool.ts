import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { JandiService } from "../services/jandiService";
import { ConfigService } from "../services/configService";
import { JandiColors } from "../types/jandi";

interface SendRichMessageInput {
  message: string;
  color?: string;
  connectInfo?: Array<{
    title?: string;
    description?: string;
    imageUrl?: string;
  }>;
  token?: string;
  tokenAlias?: string;
}

class SendRichMessageTool extends MCPTool<SendRichMessageInput> {
  name = "send_rich_message";
  description = "Send a rich message with color and attachments to Jandi via webhook";

  schema = {
    message: {
      type: z.string(),
      description: "The main message text to send to Jandi",
    },
    color: {
      type: z.string().optional(),
      description: "Hex color code for the message attachment (e.g., '#FF0000' for red). Default is Jandi's default color",
    },
    connectInfo: {
      type: z.array(z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
      })).optional(),
      description: "Array of additional information sections with optional title, description, and image URL",
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

  async execute(input: SendRichMessageInput) {
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

      // Validate color format if provided
      if (input.color && !input.color.match(/^#[0-9A-F]{6}$/i)) {
        return {
          success: false,
          error: "Invalid color format. Color should be a hex color code (e.g., '#FF0000')"
        };
      }

      // Create rich message
      const message = JandiService.createRichMessage(
        input.message,
        input.color,
        input.connectInfo
      );

      // Send message
      const result = await JandiService.sendMessage(config, message);

      if (result.success) {
        return {
          success: true,
          message: "Rich message sent successfully to Jandi",
          tokenUsed: config.alias || 'direct',
          messageDetails: {
            color: input.color || JandiColors.DEFAULT,
            attachments: input.connectInfo?.length || 0
          }
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

export default SendRichMessageTool;