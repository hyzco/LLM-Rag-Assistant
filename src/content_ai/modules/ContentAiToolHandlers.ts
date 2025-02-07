import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { ITool } from "../../modules/aiTools/AiTools";
import NoteManagementPlugin, {
  INote,
} from "../../plugins/NoteManagement.plugin";
import Api, { ApiMethods } from "../../utils/Api";
import logger from "../../utils/Logger";
import ContentAI from "../content.RAG";

export default class ContentAiToolHandlers {
  protected ragInstance: ContentAI;

  constructor(ragInstance: ContentAI) {
    if (!ragInstance) {
      throw new Error(
        "Invalid ContentAI instance provided to ContentAiToolHandlers."
      );
    }
    this.ragInstance = ragInstance;
  }

  /**
   * Handles Content Idea Generation Tool
   * @param userInput - User-provided input for generating content ideas.
   * @param toolJson - Tool configuration and arguments.
   */
  public async handleContentIdeaGeneratorTool(
    userInput: string,
    toolJson: ITool
  ) {
    try {
      const topic = toolJson.toolArgs.topic;
      const keywords = toolJson.toolArgs.keywords;

      if (!topic || !keywords) {
        throw new Error(
          "Topic and keywords must be provided for content idea generation."
        );
      }

      logger.info(`Generating content ideas for topic: ${topic}`);
      const generatedPrompt = this.ragInstance.generatePrompt([
        new SystemMessage(
          `${toolJson.toolName} tool invoked. Tool description: ${toolJson.toolDescription} - Rules to obey: ${toolJson.toolRules}`
        ),
        // new HumanMessage(`User input: ${userInput}`),
      ]);
      const response = await this.ragInstance.invokePrompt(generatedPrompt);
      logger.info("Generated content ideas successfully.");
      return response;
    } catch (error) {
      logger.error(`Error in handleContentIdeaGeneratorTool: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handles Content Production Tool
   * @param userInput - User-provided input for producing detailed content.
   * @param toolJson - Tool configuration and arguments.
   */
  public async handleContentProductionTool(userInput: string, toolJson: ITool) {
    try {
      const { topic, wordCount, tone, style, language } = toolJson.toolArgs;
      console.log("handling content production tool");
      const systemPrompt = `
        Generate detailed content about topic: ${topic}.
        Word Count: ${wordCount || "100"}.
        Tone: ${tone || "Neutral"}.
        Style: ${style || "General"}.
        Language: ${language || "en"}.
      `;

      const generatedPrompt = this.ragInstance.generatePrompt([
        new SystemMessage(systemPrompt),
        new HumanMessage(`User input: ${userInput}`),
      ]);
      const response = await this.ragInstance.invokePrompt(generatedPrompt);

      logger.info("Content produced successfully.");
      return response;
    } catch (error) {
      logger.error(`Error in handleContentProductionTool: ${error.message}`);
      throw error;
    }
  }
}
