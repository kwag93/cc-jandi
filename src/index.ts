import { MCPServer } from "mcp-framework";
import { ConfigService } from "./services/configService.js";

// Initialize configuration service
ConfigService.initialize();

const server = new MCPServer();

server.start();