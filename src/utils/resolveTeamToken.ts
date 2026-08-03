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

  // Plugin installs supply the team credentials under the `default` alias, so fall
  // back to it the way incoming resolution does. Without this, a user who filled in
  // the plugin's team fields would still have to pass tokenAlias: "default" by hand.
  const config = ConfigService.getTeamToken('default');
  if (config) {
    return { success: true, config };
  }

  return {
    success: false,
    error: "No team webhook configured. Provide teamId+token, or a tokenAlias, or set JANDI_TEAM_ID_{alias} and JANDI_TEAM_TOKEN_{alias}. Note that Team Incoming Webhook is a paid-team feature and Tosslab issues the credentials."
  };
}
