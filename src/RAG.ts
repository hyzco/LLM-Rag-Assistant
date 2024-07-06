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
      CassandraClient.keySpace = "eva_chat";
      CassandraClient.secureConnectBundle =
        "config/secure-connect-eva-chat.zip";

      const db = CassandraVectorDatabase.getInstance();

      this.chatModel = null;
      this.dialogRounds = 10;
      this.conversationHistory = [];
      this.aiTools = new AiTools();
      this.vectorDatabase = db;
      this.noteManagementPlugin = new NoteManagementPlugin(db);
    } catch (error) {
      logger.error("RAG Class:", error);
    }
    console.timeEnd("RAG constructor");
  }

  /**
   * Initialize and build the chat model.
   * @returns Promise<ChatOllama>
   */
  public async build(): Promise<ChatOllama> {
    console.time("Chat model build");
    try {
      this.chatModel = new ChatOllama({
        baseUrl: process.env.OLLAMA_HOST,
        model: process.env.DEFAULT_MODEL,
      });
      logger.info("Chat model is built.");
    } catch (error) {
      logger.error("Chat model could not be builded: ", error);
    }
    console.timeEnd("Chat model build");
    return this.chatModel;
  }

  /**
   * Validate if the determined tool is appropriate for the user's input.
   * @param userInput User input string
   * @param toolName Tool name determined by the AI
   * @returns Promise<boolean> Validation result
   */
  public async validateToolSelection(
    userInput: string,
    toolName: string
  ): Promise<boolean> {
    console.time("validateToolSelection");
    try {
      const prompt = `You need to validate if the selected tool is appropriate for the given user input. Respond with 'yes' if the tool is appropriate and 'no' otherwise.
      \n User input: "${userInput}". \n Selected tool: "${this.aiTools.getTool(
        toolName
      )}".`;

      const response = await this.chatModel.invoke([new SystemMessage(prompt)]);
      const validationResponse = response.content.toString().trim();
      const isValid = validationResponse.toLowerCase() === "yes";
      console.timeEnd("validateToolSelection");
      return isValid;
    } catch (error) {
      logger.error("Tool selection could not be validated: ", error);
      return false;
    }
  }

  /**
   * Determine the appropriate tool based on user input.
   * @param userInput User input string
   * @returns Promise<string> Tool name
   */
  public async determineTool(userInput: string): Promise<string> {
    console.time("determineTool");
    try {
      let toolName = "default";
      let attempts = 1;
      const maxAttempts = 3;

      while (attempts <= maxAttempts) {
        const prompt = `Based on the user input, determine the most appropriate tool to use from the available tools:\n${this.aiTools.listTools()}
        \n When you determine respond with the tool's name. 
        Otherwise, respond with 'default'. \n  User input: "${userInput}". Response should be single word only.`;

        const response = await this.chatModel.invoke([
          new SystemMessage(prompt),
        ]);
        toolName = response.content.toString().trim();

        const isValidTool = await this.validateToolSelection(
          userInput,
          toolName
        );

        logger.info(
          `${toolName} is ${
            isValidTool ? "valid" : "not valid"
          } tool according to user's input.${
            !isValidTool ? ` Retrying.. ${attempts}/${maxAttempts}` : ""
          }`
        );

        if (isValidTool) {
          console.timeEnd("determineTool");
          return toolName;
        }

        attempts++;
      }

      console.timeEnd("determineTool");
      return "default";
    } catch (error) {
      logger.error("Tool could not be determined: ", error);
      return "default";
    }
  }

  /**
   * Build a tool based on user input and existing tool configuration.
   * @param userInput User input string
   * @param tool Existing tool configuration
   * @returns Promise<any | null> Built tool options or null on failure
   */
  public async buildTool(userInput: string, tool: ITool): Promise<any | null> {
    console.time("buildTool");
    const maxAttempts = 3;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const promptText = `You are JSON modifier, your mission is to receive Tool JSON and fill in the missing values according to user input. Do not add new attributes, preserve the structure, only fill. Respond with the JSON only, nothing else.`;

        const prompt = ChatPromptTemplate.fromMessages([
          new SystemMessage(promptText),
          new HumanMessage(
            `User input JSON: ${userInput}. Tool JSON: ${tool.toString()}.`
          ),
        ]);

        const chain = prompt
          .pipe(this.chatModel)
          .pipe(new StringOutputParser());
        const result = await chain.invoke({});

        try {
          const parsedToolOptions = JSON.parse(result);
          logger.log("Tool build is success.");
          console.timeEnd("buildTool");
          return parsedToolOptions;
        } catch (error) {
          logger.error("Error processing tool:", error);
        }
      } catch (error) {
        logger.error("Tool could not be built: ", error);
      }

      attempts++;
      if (attempts < maxAttempts) {
        logger.warn(
          `Retrying buildTool... Attempt ${attempts + 1} of ${maxAttempts}`
        );
      }
    }

    console.timeEnd("buildTool");
    return null;
  }

  /**
   * Evaluate JSON data and provide a short outcome based on its contents.
   * @param data JSON input string
   * @returns Promise<string> Evaluated outcome
   */
  public async jsonEvaluator(
    data: string,
    question?: string
  ): Promise<IterableReadableStream<string>> {
    console.time("jsonEvaluator");
    try {
      const promptText = `You are JSON evaluator, your mission is to receive JSON response of an API response and you will read the data and give a summary of the data, nothing else. Please, use the user input as the base information, don't change data, keep it short. Don't mention 'JSON' keyword in your response.`;

      const prompt = ChatPromptTemplate.fromMessages([
        new SystemMessage(promptText),
        new AIMessage(`Data: ${data}.`),
        new HumanMessage(`Question: ${question}`),
      ]);

      const chain: Promise<IterableReadableStream<string>> = prompt
        .pipe(this.chatModel)
        .pipe(new StringOutputParser())
        .stream({});

      console.timeEnd("jsonEvaluator");
      logger.log("Tool JSON evaluation is success.");
      return chain;
    } catch (error) {
      logger.error("Tool JSON could not be evaluated: ", error);
    }
  }

  /**
   * Optimize a text query for AI note application.
   * @param query Query string to optimize
   * @returns Promise<string> Optimized query
   */
  public async queryOptimizer(query: string): Promise<string> {
    console.time("queryOptimizer");
    try {
      const promptText = `You are text input optimizer for AI note application, your mission is to prepare a shorter version of the given text input for vector database search. Optimize for performance. Respond only with very short text, nothing else.`;

      const prompt = ChatPromptTemplate.fromMessages([
        new SystemMessage(promptText),
        new HumanMessage(`Query to optimize = ${query}.`),
      ]);

      const chain = await prompt
        .pipe(this.chatModel)
        .pipe(new StringOutputParser())
        .invoke({});

      console.timeEnd("queryOptimizer");
      logger.log("Query optimization is success.");
      return chain;
    } catch (error) {
      logger.error("Query could not be optimized for AI. ", error);
    }
  }
}
