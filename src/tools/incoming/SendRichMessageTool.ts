import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { IncomingWebhookService } from "../../services/IncomingWebhookService.js";
import { resolveIncomingToken } from "../../utils/resolveToken.js";
import { validateHexColor } from "../../utils/validateColor.js";
import { JandiColors } from "../../types/common.js";

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
  description = "Send a rich message with color and attachments to Jandi channel via Incoming Webhook";

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
      const resolved = resolveIncomingToken(input);
      if (!resolved.success) {
        return { success: false, error: resolved.error };
      }

      let normalizedColor = input.color;
      if (input.color) {
        const colorResult = validateHexColor(input.color);
        if (!colorResult.valid) {
          return { success: false, error: colorResult.error };
        }
        normalizedColor = colorResult.normalized;
      }

      const message = IncomingWebhookService.createRichMessage(
        input.message,
        normalizedColor,
        input.connectInfo
      );
      const result = await IncomingWebhookService.sendMessage(resolved.config, message);

      if (result.success) {
        return {
          success: true,
          data: {
            message: "Rich message sent successfully to Jandi",
            tokenUsed: resolved.config.alias || 'direct',
            messageDetails: {
              color: input.color || JandiColors.DEFAULT,
              attachments: input.connectInfo?.length || 0
            }
          }
        };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: `Unexpected error: ${error}` };
    }
  }
}

export default SendRichMessageTool;
