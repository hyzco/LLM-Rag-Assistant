import { ChatOllama } from "@langchain/community/chat_models/ollama";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import AiTools, { ITool } from "./modules/aiTools/AiTools.js";
import CassandraVectorDatabase from "./database/CassandraVectorDatabase.js";
import NoteManagementPlugin from "./plugins/NoteManagement.plugin.js";
import { CassandraClient } from "./database/CassandraClient.js";
import { IterableReadableStream } from "@langchain/core/utils/stream";

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
      console.error("RAG Class:", error);
    }
    console.timeEnd("RAG constructor");
  }

  /**
   * Initialize and build the chat model.
   * @returns Promise<ChatOllama>
   */
  public async build(): Promise<ChatOllama> {
    console.time("build");
    this.chatModel = new ChatOllama({
      baseUrl: process.env.OLLAMA_HOST,
      model: process.env.DEFAULT_MODEL,
    });
    console.timeEnd("build");
    return this.chatModel;
  }

  /**
   * Determine the appropriate tool based on user input.
   * @param userInput User input string
   * @returns Promise<string> Tool name
   */
  public async determineTool(userInput: string): Promise<string> {
    console.time("determineTool");
    const prompt = `Based on the user input, determine the most appropriate tool to use from the available tools:\n${this.aiTools.listTools()}
    \n If the user input suggests a specific tool's functionality, respond with that tool's name. 
    Otherwise, assume 'default' as the tool name.\n\nUser input: "${userInput}"\n
    Respond with the appropriate tool name based on the user's query. Respond with single word.`;

    const response = await this.chatModel.invoke([new SystemMessage(prompt)]);
    const toolName = response.content.toString().trim();

    const tool = this.aiTools.getTool(toolName);
    console.timeEnd("determineTool");
    return tool ? toolName : "default";
  }

  /**
   * Build a tool based on user input and existing tool configuration.
   * @param userInput User input string
   * @param tool Existing tool configuration
   * @returns Promise<any | null> Built tool options or null on failure
   */
  public async buildTool(
    userInput: string,
    tool: ITool
  ): Promise<any | null> {
    console.time("buildTool");

    const promptText = `You are JSON modifier, your mission is to receive Tool JSON and fill in the missing values according to user input. Do not add new attributes, preserve the structure, only fill. Respond with the JSON only, nothing else.`;

    const prompt = ChatPromptTemplate.fromMessages([
      new SystemMessage(promptText),
      new HumanMessage(
        `User input JSON: ${userInput}. Tool JSON: ${tool.toString()}.`
      ),
    ]);

    const chain = prompt.pipe(this.chatModel).pipe(new StringOutputParser());
    const result = await chain.invoke({});

    try {
      const parsedToolOptions = JSON.parse(result);
      console.timeEnd("buildTool");
      return parsedToolOptions;
    } catch (error) {
      console.error("Error processing tool:", error);
      console.timeEnd("buildTool");
      return null;
    }
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
    return chain;
  }

  /**
   * Optimize a text query for AI note application.
   * @param query Query string to optimize
   * @returns Promise<string> Optimized query
   */
  public async queryOptimizer(query: string): Promise<string> {
    console.time("queryOptimizer");
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
    return chain;
  }
}
