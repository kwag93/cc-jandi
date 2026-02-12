import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { TeamIncomingWebhookService } from "../../services/TeamIncomingWebhookService.js";
import { resolveTeamToken } from "../../utils/resolveTeamToken.js";

interface ValidateTeamTokenInput {
  teamId?: string;
  token?: string;
  tokenAlias?: string;
}

class ValidateTeamTokenTool extends MCPTool<ValidateTeamTokenInput> {
  name = "validate_team_token";
  description = "Validate a Jandi Team Incoming Webhook token by testing the endpoint";

  schema = {
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

  async execute(input: ValidateTeamTokenInput) {
    try {
      const resolved = resolveTeamToken(input);
      if (!resolved.success) {
        return { success: false, error: resolved.error };
      }

      const result = await TeamIncomingWebhookService.validateToken(resolved.config);

      if (result.success) {
        return {
          success: true,
          message: "Team webhook token is valid",
          tokenAlias: resolved.config.alias || 'direct'
        };
      } else {
        return {
          success: false,
          error: result.error,
          tokenAlias: resolved.config.alias || 'direct'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Unexpected error during team token validation: ${error}`
      };
    }
  }
}

export default ValidateTeamTokenTool;
