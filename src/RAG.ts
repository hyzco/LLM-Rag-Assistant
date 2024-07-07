import { ChatOllama } from "@langchain/community/chat_models/ollama";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import AiTools, { ITool } from "./modules/aiTools/AiTools";
import CassandraVectorDatabase from "./database/CassandraVectorDatabase";
import NoteManagementPlugin from "./plugins/NoteManagement.plugin";
import { CassandraClient } from "./database/CassandraClient";
import { IterableReadableStream } from "@langchain/core/utils/stream";
import logger from "./utils/Logger";
import { BaseMessageChunk } from "@langchain/core/messages";

const TOOL_NAMES = {
  WEATHER_TOOL: "weather_tool",
  CALENDAR_TOOL: "calendar_tool",
  NOTE_TOOL: "note_tool",
  COURSE_TOOL: "course_tool",
  TIME_TOOL: "time_tool",
};

export default class RAG {
  public aiTools: AiTools;
  public noteManagementPlugin: NoteManagementPlugin;
  public chatModel: ChatOllama;
  public conversationHistory: (HumanMessage | AIMessage | SystemMessage)[];
  protected dialogRounds: number;
  protected vectorDatabase: CassandraVectorDatabase;

  constructor() {
    console.time("RAG constructor");
    try {
      CassandraClient.keySpace = process.env["ASTRA_DB_KEY_SPACE"];
      CassandraClient.secureConnectBundle =
        process.env["ASTRA_DB_SECURE_BUNDLE_PATH"];

      this.vectorDatabase = CassandraVectorDatabase.getInstance();
      this.chatModel = null;
      this.dialogRounds = 10;
      this.conversationHistory = [];
      this.aiTools = new AiTools();
      this.noteManagementPlugin = new NoteManagementPlugin(this.vectorDatabase);
    } catch (error) {
      logger.error("RAG Class:", error);
    }
    console.timeEnd("RAG constructor");
  }

  async build(): Promise<ChatOllama> {
    console.time("Chat model build");
    try {
      this.chatModel = new ChatOllama({
        baseUrl: process.env.OLLAMA_HOST,
        model: process.env.DEFAULT_MODEL,
      });
      logger.info("Chat model is built.");
    } catch (error) {
      logger.error("Chat model could not be built: ", error);
    }
    console.timeEnd("Chat model build");
    return this.chatModel;
  }

  private generatePrompt(
    messages: (SystemMessage | HumanMessage | AIMessage)[]
  ): ChatPromptTemplate {
    return ChatPromptTemplate.fromMessages(messages);
  }

  private async invokePrompt(prompt: ChatPromptTemplate): Promise<string> {
    try {
      const result = await prompt
        .pipe(this.chatModel)
        .pipe(new StringOutputParser())
        .invoke({});
      return result;
    } catch (error) {
      logger.error("Prompt invocation failed: ", error);
      throw error;
    }
  }

  async validateToolSelection(
    userInput: string,
    toolName: string
  ): Promise<boolean> {
    console.time("validateToolSelection");
    try {
      const prompt = this.generatePrompt([
        new SystemMessage(
          `You need to validate if the selected tool is appropriate for the given user input. Respond with 'yes' if the tool is appropriate and 'no' otherwise.\n User input: "${userInput}". \n Selected tool: "${this.aiTools.getTool(
            toolName
          )}".`
        ),
      ]);
      const response = await this.invokePrompt(prompt);
      console.timeEnd("validateToolSelection");
      return response.trim().toLowerCase() === "yes";
    } catch (error) {
      logger.error("Tool selection could not be validated: ", error);
      return false;
    }
  }

  async determineTool(userInput: string): Promise<string> {
    console.time("determineTool");
    const maxAttempts = 3;
    const tools = this.aiTools.listToolNames();

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const prompt = this.generatePrompt([
          new SystemMessage(
            `Based on the user input, determine the most appropriate tool from the available tools:\n${tools})}\nPlease respond with the tool's name or 'default'.\nUser input: "${userInput}". Response with tool name only.`
          ),
        ]);
        const toolName = (await this.invokePrompt(prompt)).trim();

        if (await this.validateToolSelection(userInput, toolName)) {
          logger.info(`${toolName} is a valid tool for the user's input.`);
          console.timeEnd("determineTool");
          return toolName;
        }
        logger.info(
          `Invalid tool selection. Retrying.. ${attempt}/${maxAttempts}`
        );
      } catch (error) {
        logger.error("Tool could not be determined: ", error);
      }
    }

    console.timeEnd("determineTool");
    return "default";
  }

  async buildTool(userInput: string, tool: ITool): Promise<ITool | null> {
    console.time("buildTool");
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const prompt = this.generatePrompt([
          new SystemMessage(
            `You are JSON modifier, your mission is to receive Tool JSON and fill in the missing values according to user input. Do not add new attributes, preserve the structure, only fill. Respond with the JSON only, nothing else.`
          ),
          new HumanMessage(
            `User input: ${userInput}. Tool JSON: ${tool.toString()}.`
          ),
        ]);

        const result = await this.invokePrompt(prompt);
        const parsedToolOptions: ITool = JSON.parse(result);
        logger.info("Tool build is successful.");
        console.timeEnd("buildTool");
        return parsedToolOptions;
      } catch (error) {
        logger.error("Tool could not be built: ", error);
        logger.warn(
          `Retrying buildTool... Attempt ${attempt + 1} of ${maxAttempts}`
        );
      }
    }

    console.timeEnd("buildTool");
    return null;
  }

  async jsonEvaluator(
    data: string,
    question?: string
  ): Promise<IterableReadableStream<string>> {
    console.time("jsonEvaluator");
    try {
      const prompt = this.generatePrompt([
        new SystemMessage(
          `You are JSON evaluator, your mission is to receive JSON response of an API response and you will read the data and give a summary of the data, nothing else. Please, use the user input as the base information, don't change data, keep it short. Don't mention 'JSON' keyword in your response.`
        ),
        new AIMessage(`Data: ${data}.`),
        new HumanMessage(`Question: ${question}`),
      ]);

      const chain = prompt
        .pipe(this.chatModel)
        .pipe(new StringOutputParser())
        .stream({});
      console.timeEnd("jsonEvaluator");
      logger.log("Tool JSON evaluation is successful.");
      return chain;
    } catch (error) {
      logger.error("Tool JSON could not be evaluated: ", error);
    }
  }

  async queryOptimizer(query: string): Promise<string> {
    console.time("queryOptimizer");
    try {
      const prompt = this.generatePrompt([
        new SystemMessage(
          `You are text input optimizer for AI note application, your mission is to prepare a shorter version of the given text input for vector database search. Optimize for performance. Respond only with very short text, nothing else.`
        ),
        new HumanMessage(`Query to optimize = ${query}.`),
      ]);

      const result = await this.invokePrompt(prompt);
      console.timeEnd("queryOptimizer");
      logger.log("Query optimization is successful.");
      return result;
    } catch (error) {
      logger.error("Query could not be optimized for AI. ", error);
    }
  }

  protected async convertResponseToString(
    response: string | IterableReadableStream<String | BaseMessageChunk>
  ) {
    if (typeof response === "string") {
      return response;
    } else {
      let responseString = "";
      for await (const chunk of response) {
        const chunkContent =
          typeof chunk === "string"
            ? chunk
            : (chunk as BaseMessageChunk).content;
        responseString += chunkContent;
        process.stdout.write(chunkContent.toString()); // Use process.stdout.write to avoid new lines
      }
      console.log();
      return responseString;
    }
  }

  protected isFollowUpQuestion(
    userInput: string,
    lastToolUsed: string | null,
    lastToolData: any,
    toolKeywords: string[]
  ): boolean {
    if (lastToolUsed && lastToolData) {
      const pattern = new RegExp(toolKeywords.join("|"), "i");
      return pattern.test(userInput);
    }
    return false;
  }
  

  protected async handleFollowUpQuestion(
    userInput: string,
    toolName: string,
    lastToolUsed: string | null,
    lastToolData: any,
    aiToolsModule: any, // Adjust the type based on your AiToolsModule definition,
    isLLMInit: boolean,
  ): Promise<IterableReadableStream<String>> {
    if (lastToolUsed === toolName && lastToolData) {
      const data = lastToolData;
      const prompt = `Handle the follow-up question after tool usage based on user input and tool data. User input: ${userInput} Previous tool data: ${data}. Respond short, precise.`;
      const response = await aiToolsModule.handleDefaultTool(prompt, isLLMInit);
      return response;
    }
  
    return new ReadableStream({
      start(controller) {
        controller.enqueue(
          "I'm not sure how to answer that based on the previous data."
        );
        controller.close();
      },
    }) as IterableReadableStream<String>;
  }
  
}
