import {
  HumanMessage,
  AIMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { IterableReadableStream } from "@langchain/core/utils/stream";
import { ChatOllama } from "@langchain/ollama";
import CassandraVectorDatabase from "../database/CassandraVectorDatabase";
import AiTools, { ITool } from "../modules/aiTools/AiTools";
import NoteManagementPlugin from "../plugins/NoteManagement.plugin";
import RAG from "../RAG";
import AiToolsModule from "../modules/aiTools/AiToolsModule";
import ToolRegistry, { Registry } from "../modules/aiTools/ToolRegistry";
import ContentAiTools from "./modules/ContentAiTools";
import ContentAiToolHandlers from "./modules/ContentAiToolHandlers";
import logger from "../utils/Logger";
import WebSocketModule from "../modules/WebSocketModule";

export default class ContentAI extends RAG {
  protected webSocketModule: WebSocketModule;

  protected aiToolsModule: AiToolsModule;
  private readonly toolRegistry = new ToolRegistry();
  private readonly contentAiToolHandlers: ContentAiToolHandlers;

  constructor() {
    super();
    this.webSocketModule = new WebSocketModule(5555);
    this.webSocketModule.initializeWebSocket();

    const tools = new ContentAiTools();
    this.contentAiToolHandlers = new ContentAiToolHandlers(this);
    this.setAiTools(tools);

    // Registering tools and handlers
    const toolRegistries = [
      {
        tool: tools.getTool("content_idea_generator"),
        handler: this.contentAiToolHandlers.handleContentIdeaGeneratorTool.bind(
          this.contentAiToolHandlers
        ),
      } as Registry,
      {
        tool: tools.getTool("content_production"),
        handler: this.contentAiToolHandlers.handleContentProductionTool.bind(
          this.contentAiToolHandlers
        ),
      } as Registry,
    ];

    toolRegistries.forEach((registry: Registry) => {
      this.toolRegistry.registerTool(registry);
    });
  }

  /**
   * Creates content ideas using the "content_idea_generator" tool
   */
  protected async produceContentIdeas(
    userInput: string
  ): Promise<IterableReadableStream<string>> {
    try {
      // Retrieve user input
      if (!userInput) {
        throw new Error("No user input provided.");
      }

      // Retrieve tool and execute it
      const { tool, handler } = this.toolRegistry.getTool(
        "content_idea_generator"
      );
      if (!tool) {
        throw new Error(
          "Tool 'content_idea_generator' not found in the registry."
        );
      }

      const toolArgs = {
        topic: "Education",
        keywords: "Learning, Online Courses, E-learning",
      };

      tool.toolArgs = toolArgs;

      const response = await handler(userInput, tool);

      if (response) {
        return response;
      } else {
        logger.warn("No response received from the 'content_generator' tool.");
      }
    } catch (error) {
      logger.error("Error in createContentIdeas:", error);
    }
  }

  /**
   * Generates detailed content using the "content_production" tool
   */
  protected async produceContent(userInput: string) {
    try {
      // Retrieve tool and execute it
      const { tool, handler } = this.toolRegistry.getTool("content_production");
      if (!tool) {
        throw new Error("Tool 'content_production' not found in the registry.");
      }

      const toolArgs = {
        topic: "Education",
        wordCount: 100,
        tone: "informative",
        style: "blog",
        language: "en",
      };

      tool.toolArgs = toolArgs;

      const response = await handler(userInput, tool);
      if (response) {
        return response;
      } else {
        logger.warn("No response received from the 'content_production' tool.");
        return "NO RESPONSE FROM AI";
      }
    } catch (error) {
      logger.error("Error in produceContent:", error);
    }
  }
}
