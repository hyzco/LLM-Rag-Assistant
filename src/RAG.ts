import { ChatOllama } from "@langchain/community/chat_models/ollama";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import initializeApplication from "./config/Initializers.js";
import AiTools, { ITool } from "./AiTools.js";
import CassandraVectorDatabase from "./database/CassandraVectorDatabase.js";
import cassandraConfig from "./config/CassandraConfig.js";
import NoteManagementPlugin from "./plugins/NoteManagement.plugin.js";

export default class RAG {
  protected chatModel: ChatOllama;
  protected dialogRounds: number;
  protected conversationHistory: (HumanMessage | AIMessage | SystemMessage)[];
  protected aiTools: AiTools;
  protected vectorDatabase: CassandraVectorDatabase;
  protected noteManagementPlugin: NoteManagementPlugin;

  constructor() {
    initializeApplication();
    const db = new CassandraVectorDatabase(cassandraConfig);
    this.chatModel = null;
    this.dialogRounds = 10;
    this.conversationHistory = [];
    this.aiTools = new AiTools();
    this.vectorDatabase = db;
    
    this.noteManagementPlugin = new NoteManagementPlugin(db);
  }

  public async build(): Promise<ChatOllama> {
    this.chatModel = new ChatOllama({
      baseUrl: process.env.OLLAMA_HOST,
      model: process.env.DEFAULT_MODEL,
    });

    return this.chatModel;
  }

  public async determineTool(userInput: string): Promise<string> {
    const prompt = `Based on the user input, determine the most appropriate tool to use from the available tools:
    ${this.aiTools
      .getAllTools()
      .map(
        (tool) =>
          `- ToolName: ${tool.toolName}; ToolDescription: ${tool.toolDescription}`
      )
      .join("\n")}
      
    If the user input suggests a specific tool's functionality, respond with that tool's name. Otherwise, assume 'default' as the tool name.
        
    User input: "${userInput}"
    Respond with the appropriate tool name based on the user's query. Respond with single word.`;

    const response = await this.chatModel.invoke([new SystemMessage(prompt)]);
    const toolName = response.content.toString().trim();

    const tool = this.aiTools.getTool(toolName);

    return tool ? toolName : "default";
  }

  protected async buildTool(
    userInput: string,
    tool: ITool
  ): Promise<any | null> {
    const promptText = `You are JSON modifier, 
    your mission is to receive Tool JSON and fill in the miissing values according to user input. Do not add new attributes, preserve the structure, only fill.
    Respond with the JSON only, nothing else.`;

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
      return parsedToolOptions;
    } catch (error) {
      console.error("Failed to parse the new tool JSON.", error);
      return null;
    }
  }

  protected async jsonEvaluator(userInput: string): Promise<string> {
    const promptText = `You are JSON evaluator, 
    your mission is to receive JSON response of an API response and you will read the data and give short outcome based on the JSON data.
    Respond with short evaluation of the data, nothing else. Please, use the user input as the base information, don't interfere with the data.`;

    const prompt = ChatPromptTemplate.fromMessages([
      new SystemMessage(promptText),
      new HumanMessage(`User input JSON: ${userInput}.`),
    ]);
    const chain = prompt.pipe(this.chatModel).pipe(new StringOutputParser());
    const result = await chain.invoke({});

    return result;
  }

  protected async queryOptimizer(query: string){
    const promptText = `You are text input optimizer for AI note application, 
    your mission is to prepare shorter version of the given text input for vector database search. Optimize for performance.
    Respond only with very short text, nothing else.`;

    const prompt = ChatPromptTemplate.fromMessages([
      new SystemMessage(promptText),
      new HumanMessage(`Query to optimize = ${query}.`),
    ]);

    const chain = prompt.pipe(this.chatModel).pipe(new StringOutputParser());
    const result = await chain.invoke({});

    return result;
  }
}
