import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { ITool } from "../../modules/aiTools/AiTools";
import NoteManagementPlugin, { INote } from "../../plugins/NoteManagement.plugin";
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

      const prompt = `
        Generate creative, user-focused, SEO-friendly content ideas for the topic:
        ${topic}.
        Keywords: ${keywords}.
        Categorize ideas under "Education", "E-commerce", "Social Media", etc.
      `;

      logger.info(`Generating content ideas for topic: ${topic}`);
      const response = await this.ragInstance(prompt);

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
      const { ideaId, wordCount, tone, style, language } = toolJson.toolArgs;

      if (!ideaId) {
        throw new Error("An idea ID must be provided for content production.");
      }

      const prompt = `
        Using the selected content idea (ID: ${ideaId}), generate detailed content.
        Word Count: ${wordCount || "100"}.
        Tone: ${tone || "Neutral"}.
        Style: ${style || "General"}.
        Language: ${language || "en"}.
      `;

      logger.info(`Producing content for idea ID: ${ideaId}`);
      // const response = await this.ragInstance.generateText(prompt);

      logger.info("Content produced successfully.");
      return response;
    } catch (error) {
      logger.error(`Error in handleContentProductionTool: ${error.message}`);
      throw error;
    }
  }
}
