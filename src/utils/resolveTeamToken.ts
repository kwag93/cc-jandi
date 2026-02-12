import { ConfigService } from '../services/configService.js';
import { TeamIncomingWebhookConfig } from '../types/team-incoming.js';

interface TeamTokenInput {
  teamId?: string;
  token?: string;
  tokenAlias?: string;
}

type ResolveResult =
  | { success: true; config: TeamIncomingWebhookConfig }
  | { success: false; error: string };

export function resolveTeamToken(input: TeamTokenInput): ResolveResult {
  if (input.teamId && input.token) {
    return {
      success: true,
      config: { teamId: input.teamId, token: input.token }
    };
  }

  if (input.tokenAlias) {
    const config = ConfigService.getTeamToken(input.tokenAlias);
    if (!config) {
      return {
        success: false,
        error: `Team token alias '${input.tokenAlias}' not found. Available aliases: ${ConfigService.listTeamTokenAliases().join(', ')}`
      };
    }
    return { success: true, config };
  }

  return {
    success: false,
    error: "Please provide teamId+token or a tokenAlias for team webhook. Set JANDI_TEAM_ID_{alias} and JANDI_TEAM_TOKEN_{alias} environment variables"
  };
}
