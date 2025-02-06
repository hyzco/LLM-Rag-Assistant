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

export default class ContentAI extends RAG {
  protected aiToolsModule: AiToolsModule;
  private readonly toolRegistry = new ToolRegistry();
  private readonly contentAiToolHandlers: ContentAiToolHandlers;

  constructor() {
    super();

    const tools = new ContentAiTools();
    this.contentAiToolHandlers = new ContentAiToolHandlers(this);
    this.setAiTools(tools);

    // Registering tools and handlers
    const toolRegistries = [
      {
        tool: tools.getTool("content_generator"),
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
  protected async createContentIdeas() {
    try {
      // Retrieve user input
      const userInput = await super.getUserInput();
      if (!userInput) {
        throw new Error("No user input provided.");
      }

      // Retrieve tool and execute it
      const { tool } = this.toolRegistry.getTool("content_generator");
      if (!tool) {
        throw new Error("Tool 'content_generator' not found in the registry.");
      }

      const response = await this.aiToolsModule.handleToolInput<ITool>(
        userInput,
        tool.toolName
      );

      if (response) {
        console.log(response);
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
  protected async produceContent(ideaId: string) {
    try {
      if (!ideaId) {
        throw new Error("Idea ID must be provided for content production.");
      }

      // Retrieve tool and execute it
      const tool = this.toolRegistry.getTool("content_production");
      if (!tool) {
        throw new Error("Tool 'content_production' not found in the registry.");
      }

      const toolArgs = {
        ideaId,
        wordCount: 500, // Example default value
        tone: "informative",
        style: "blog",
        language: "en",
      };

      const response = await tool.handler(JSON.stringify(toolArgs), tool.tool);
      if (response) {
        console.log(response);
        // process.stdout.write(); // Write response to stdout
      } else {
        logger.warn("No response received from the 'content_production' tool.");
      }
    } catch (error) {
      logger.error("Error in produceContent:", error);
    }
  }
}
