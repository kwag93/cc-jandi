import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { IncomingWebhookService } from "../../services/IncomingWebhookService.js";
import { resolveIncomingToken } from "../../utils/resolveToken.js";
import { JandiColors, MessageType } from "../../types/common.js";

interface TestWebhookInput {
  token?: string;
  tokenAlias?: string;
  testType?: 'basic' | 'rich' | 'all';
}

class TestWebhookTool extends MCPTool<TestWebhookInput> {
  name = "test_webhook";
  description = "Test Jandi Incoming Webhook connection by sending various test messages";

  schema = {
    token: {
      type: z.string().optional(),
      description: "Jandi webhook token to test — the part of the Connect webhook URL after '/connect-api/webhook/'. If not provided, will use tokenAlias or default token",
    },
    tokenAlias: {
      type: z.string().optional(),
      description: "Token alias from configuration to test (e.g., 'default', 'dev', 'prod'). If not provided, will use 'default'",
    },
    testType: {
      type: z.enum(['basic', 'rich', 'all']).optional(),
      description: "Type of test to perform: 'basic' (simple message), 'rich' (rich message), 'all' (comprehensive test). Default is 'basic'",
    },
  };

  async execute(input: TestWebhookInput) {
    try {
      const resolved = resolveIncomingToken(input);
      if (!resolved.success) {
        return { success: false, error: resolved.error };
      }

      const config = resolved.config;
      const testType = input.testType || 'basic';
      const timestamp = new Date().toISOString();
      const results: Array<{ type: string; success: boolean; error?: string; errorCode?: number }> = [];

      if (testType === 'basic' || testType === 'all') {
        const basicMessage = IncomingWebhookService.createBasicMessage(
          `🧪 Basic webhook test - ${timestamp}`
        );
        const basicResult = await IncomingWebhookService.sendMessage(config, basicMessage);
        results.push({
          type: 'basic',
          success: basicResult.success,
          error: basicResult.error,
          errorCode: basicResult.errorCode
        });
      }

      if (testType === 'rich' || testType === 'all') {
        const richMessage = IncomingWebhookService.createRichMessage(
          `🎨 Rich webhook test - ${timestamp}`,
          JandiColors.BLUE,
          [{
            title: 'Test Section',
            description: 'This is a test of rich message functionality with color and attachments.',
          }]
        );
        const richResult = await IncomingWebhookService.sendMessage(config, richMessage);
        results.push({
          type: 'rich',
          success: richResult.success,
          error: richResult.error,
          errorCode: richResult.errorCode
        });
      }

      if (testType === 'all') {
        const statusTypes = [MessageType.SUCCESS, MessageType.WARNING, MessageType.ERROR];

        for (const statusType of statusTypes) {
          const statusMessage = IncomingWebhookService.createStatusMessage(
            `${statusType.toUpperCase()} status test - ${timestamp}`,
            statusType,
            `This is a test of ${statusType} message type`
          );
          const statusResult = await IncomingWebhookService.sendMessage(config, statusMessage);
          results.push({
            type: `status_${statusType}`,
            success: statusResult.success,
            error: statusResult.error,
            errorCode: statusResult.errorCode
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;
      const allSuccessful = successCount === totalCount;

      return {
        success: allSuccessful,
        data: {
          message: allSuccessful
            ? `All ${totalCount} webhook tests passed successfully`
            : `${successCount}/${totalCount} webhook tests passed`,
          tokenUsed: config.alias || 'direct',
          testType,
          timestamp,
          results,
          summary: {
            total: totalCount,
            successful: successCount,
            failed: totalCount - successCount
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Unexpected error during webhook test: ${error}`
      };
    }
  }
}

export default TestWebhookTool;
