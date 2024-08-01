import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ITool } from "./AiTools";
import Chat from "../../chat/chat.RAG";
import { IToolRegistry, Registry } from "./ToolRegistry";

export default class AiToolsModule {
  protected ragInstance: Chat;
  private toolRegistry: IToolRegistry;

  constructor(ragInstance: Chat, toolRegistry: IToolRegistry) {
    this.ragInstance = ragInstance;
    this.toolRegistry = toolRegistry;
  }

  // Retrieve a tool handler from the registry
  public getHandler(toolName: string): Registry["handler"] | undefined {
    return this.toolRegistry.getTool(toolName).handler;
  }

  // Handle tool input (common method for weather_tool and note_tool)
  public async handleToolInput<T extends ITool>(
    userInput: string,
    toolName: string
  ) {
    this.ragInstance.conversationHistory.push(new HumanMessage(userInput));

    const toolJson: T = (await this.ragInstance.buildTool(
      userInput,
      this.toolRegistry.getTool(toolName).tool as T
    )) as T;

    const response = await this.getHandler(toolName)(userInput, toolJson);
    return response;
  }

  // Handle default tool
  public handleDefaultTool(userInput: string, init: boolean) {
    const prompt = `You are a cool virtual assistant and have few available tools your boss to use. Always give very short answers. Don't force to suggest tools. Tools: ${this.ragInstance.aiTools.listTools()}`;
    const message = init
      ? new SystemMessage(prompt)
      : new HumanMessage(userInput);
    this.ragInstance.conversationHistory.push(message);

    const stream = this.ragInstance.chatModel.stream([
      ...this.ragInstance.conversationHistory,
    ]);

    return stream;
  }
}

// // Handle course tool input
