import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { IncomingWebhookService } from "../../services/IncomingWebhookService.js";
import { resolveIncomingToken } from "../../utils/resolveToken.js";

interface SendMessageInput {
  message: string;
  token?: string;
  tokenAlias?: string;
}

class SendMessageTool extends MCPTool<SendMessageInput> {
  name = "send_message";
  description = "Send a basic text message to Jandi channel via Incoming Webhook";

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
      const resolved = resolveIncomingToken(input);
      if (!resolved.success) {
        return { success: false, error: resolved.error };
      }

      const message = IncomingWebhookService.createBasicMessage(input.message);
      const result = await IncomingWebhookService.sendMessage(resolved.config, message);

      if (result.success) {
        return {
          success: true,
          data: {
            message: "Message sent successfully to Jandi",
            tokenUsed: resolved.config.alias || 'direct'
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

export default SendMessageTool;
