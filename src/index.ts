import { MCPServer } from "mcp-framework";
import { ConfigService } from "./services/configService";

// Initialize configuration service
ConfigService.initialize();

const server = new MCPServer();

server.start();