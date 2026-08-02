import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { TeamIncomingWebhookService } from "../../services/TeamIncomingWebhookService.js";
import { resolveTeamToken } from "../../utils/resolveTeamToken.js";

interface SendTeamMessageInput {
  email: string;
  message: string;
  teamId?: string;
  token?: string;
  tokenAlias?: string;
}

class SendTeamMessageTool extends MCPTool<SendTeamMessageInput> {
  name = "send_team_message";
  description = "Send a text message to specific team member(s) via Jandi Team Incoming Webhook. Messages are sent as personal messages to the specified email addresses.";

  schema = {
    email: {
      type: z.string(),
      description: "Comma-separated email addresses of recipients (max 100). e.g., 'user1@example.com,user2@example.com'",
    },
    message: {
      type: z.string(),
      description: "The message text to send",
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
      description: "Team token alias from configuration (e.g., 'sales'). Maps to JANDI_TEAM_ID_{alias} and JANDI_TEAM_TOKEN_{alias} env vars",
    },
  };

  async execute(input: SendTeamMessageInput) {
    try {
      const resolved = resolveTeamToken(input);
      if (!resolved.success) {
        return { success: false, error: resolved.error };
      }

      const message = TeamIncomingWebhookService.createBasicMessage(input.message, input.email);
      const result = await TeamIncomingWebhookService.sendMessage(resolved.config, message);

      if (result.success) {
        return {
          success: true,
          data: {
            message: "Team message sent successfully",
            tokenUsed: resolved.config.alias || 'direct',
            recipients: input.email,
            // Jandi reports per-recipient delivery; surface it so the caller can see
            // which addresses it could not match to an account.
            ...(result.validEmails ? { validEmails: result.validEmails } : {}),
            ...(result.invalidEmails ? { invalidEmails: result.invalidEmails } : {})
          }
        };
      } else {
        return { success: false, error: result.error, errorCode: result.errorCode };
      }
    } catch (error) {
      return { success: false, error: `Unexpected error: ${error}` };
    }
  }
}

export default SendTeamMessageTool;
