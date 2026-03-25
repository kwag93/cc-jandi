import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { TeamIncomingWebhookService } from "../../services/TeamIncomingWebhookService.js";
import { resolveTeamToken } from "../../utils/resolveTeamToken.js";
import { validateHexColor } from "../../utils/validateColor.js";
import { JandiColors } from "../../types/common.js";

interface SendTeamRichMessageInput {
  email: string;
  message: string;
  color?: string;
  connectInfo?: Array<{
    title?: string;
    description?: string;
    imageUrl?: string;
  }>;
  teamId?: string;
  token?: string;
  tokenAlias?: string;
}

class SendTeamRichMessageTool extends MCPTool<SendTeamRichMessageInput> {
  name = "send_team_rich_message";
  description = "Send a rich message with color and attachments to specific team member(s) via Jandi Team Incoming Webhook";

  schema = {
    email: {
      type: z.string(),
      description: "Comma-separated email addresses of recipients (max 100)",
    },
    message: {
      type: z.string(),
      description: "The main message text to send",
    },
    color: {
      type: z.string().optional(),
      description: "Hex color code for the message (e.g., '#FF0000'). Default is Jandi's default color",
    },
    connectInfo: {
      type: z.array(z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
      })).optional(),
      description: "Array of additional information sections with optional title, description, and image URL",
    },
    teamId: {
      type: z.string().optional(),
      description: "Jandi team ID. Required if not using tokenAlias",
    },
    token: {
      type: z.string().optional(),
      description: "Jandi team webhook token. Required if not using tokenAlias",
    },
    tokenAlias: {
      type: z.string().optional(),
      description: "Team token alias from configuration (e.g., 'sales')",
    },
  };

  async execute(input: SendTeamRichMessageInput) {
    try {
      const resolved = resolveTeamToken(input);
      if (!resolved.success) {
        return { success: false, error: resolved.error };
      }

      if (input.color) {
        const colorResult = validateHexColor(input.color);
        if (!colorResult.valid) {
          return { success: false, error: colorResult.error };
        }
      }

      const message = TeamIncomingWebhookService.createRichMessage(
        input.message,
        input.email,
        input.color,
        input.connectInfo
      );
      const result = await TeamIncomingWebhookService.sendMessage(resolved.config, message);

      if (result.success) {
        return {
          success: true,
          message: "Team rich message sent successfully",
          tokenUsed: resolved.config.alias || 'direct',
          recipients: input.email,
          messageDetails: {
            color: input.color || JandiColors.DEFAULT,
            attachments: input.connectInfo?.length || 0
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

export default SendTeamRichMessageTool;
