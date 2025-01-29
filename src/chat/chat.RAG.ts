import { BaseMessageChunk, HumanMessage } from "@langchain/core/messages";
import inquirer, { PromptModule } from "inquirer";
import RAG from "../RAG";
import { IterableReadableStream } from "@langchain/core/utils/stream";
import WebSocketModule from "../modules/WebSocketModule";
import AiToolsModule from "../modules/aiTools/AiToolsModule";
import logger from "../utils/Logger";
import ChatTools from "./modules/ChatTools";
import ChatToolHandlers from "./modules/ChatToolHandlers";
import { ITool } from "../modules/aiTools/AiTools";
import ToolRegistry, { Registry } from "../modules/aiTools/ToolRegistry";

const TOOL_NAMES = {
  WEATHER_TOOL: "weather_tool",
  CALENDAR_TOOL: "calendar_tool",
  NOTE_TOOL: "note_tool",
  COURSE_TOOL: "course_tool",
  TIME_TOOL: "time_tool",
};

interface Context {
  isLLMInit: boolean;
  lastToolUsed: string | null;
  lastToolData: any;
}

export default class Chat extends RAG {
  private readonly context: Context = {
    isLLMInit: true,
    lastToolUsed: null,
    lastToolData: null,
  };
  protected inquirer: PromptModule;
  protected webSocketModule: WebSocketModule;
  protected aiToolsModule: AiToolsModule;
  private readonly toolRegistry = new ToolRegistry();
  private readonly chatToolHandlers: ChatToolHandlers;

  constructor() {
    super();
    this.inquirer = inquirer.createPromptModule();
    this.webSocketModule = new WebSocketModule(8080);
    this.aiToolsModule = new AiToolsModule(this, this.toolRegistry);

    const chatTools = new ChatTools();
    this.chatToolHandlers = new ChatToolHandlers(this);
    this.setAiTools(chatTools);

    const toolRegistries = [
      {
        tool: chatTools.weatherTool(),
        handler: this.chatToolHandlers.handleWeatherTool.bind(
          this.chatToolHandlers
        ),
      } as Registry,
      {
        tool: chatTools.noteTool(),
        handler: this.chatToolHandlers.handleNoteTool.bind(
          this.chatToolHandlers
        ),
      } as Registry,
      {
        tool: chatTools.courseTool(),
        handler: this.chatToolHandlers.handleCourseTool.bind(
          this.chatToolHandlers
        ),
      } as Registry,
      {
        tool: chatTools.timeTool(),
        handler: this.chatToolHandlers.handleTimeTool.bind(
          this.chatToolHandlers
        ),
      } as Registry,
    ];

    toolRegistries.forEach((registry: Registry) => {
      this.toolRegistry.registerTool(registry);
    });
  }

  // Process user input with context tracking
  public async processUserInput(socketInput: string | null = null) {
    try {
      const userInput = socketInput ?? (await this.getUserInput());
      const toolName: string = await this.determineTool(userInput);

      if (toolName) {
        logger.log(`Determined tool: ${toolName}`);
        const response = await this.getAiResponse(toolName, userInput);
        if (response) {
          this.conversationHistory.push(new HumanMessage(response));
          this.webSocketModule.sendMessageToClients(response);
          process.stdout.write(response); // Use process.stdout.write to avoid new lines
        } else {
          logger.log(
            "We had troubles here to retrieve response from LLM. Try again."
          );
        }
      }
    } catch (error) {
      logger.error("Error processing user input:", error);
    }
  }

  // Determine the appropriate tool and get the response
  private async getAiResponse(
    toolName: string,
    userInput: string
  ): Promise<string | void> {
    let response: string | IterableReadableStream<string | BaseMessageChunk>;
    if (this.isFollowUpQuestion(userInput, toolName)) {
      console.log("is follow up question?", "yes");
      response = await this.handleFollowUpQuestion(userInput, toolName);
    } else {
      switch (toolName.trim()) {
        case TOOL_NAMES.WEATHER_TOOL:
          response = await this.aiToolsModule.handleToolInput<ITool>(
            userInput,
            TOOL_NAMES.WEATHER_TOOL
          );

          break;
        case TOOL_NAMES.CALENDAR_TOOL:
          logger.log("Tool has no method definition.");
          break;
        case TOOL_NAMES.NOTE_TOOL:
          response = await this.aiToolsModule.handleToolInput<ITool>(
            userInput,
            TOOL_NAMES.NOTE_TOOL
          );

          break;
        case TOOL_NAMES.COURSE_TOOL:
          response = await this.aiToolsModule.handleToolInput<ITool>(
            userInput,
            TOOL_NAMES.COURSE_TOOL
          );

          break;
        case TOOL_NAMES.TIME_TOOL:
          response = await this.aiToolsModule.handleToolInput<ITool>(
            userInput,
            TOOL_NAMES.TIME_TOOL
          );

          break;
        default:
          response = await this.aiToolsModule.handleDefaultTool(
            userInput,
            this.context.isLLMInit
          );
          this.context.isLLMInit = false;
          break;
      }
      this.context.lastToolUsed = toolName.trim();
      this.context.lastToolData = response;
    }

    return this.removeThinkingMessage(
      await this.convertResponseToString(response)
    );
  }

  // Convert response to string if it is iterable
  protected convertResponseToString(
    response: string | IterableReadableStream<string | BaseMessageChunk>
  ) {
    return super.convertResponseToString(response);
  }

  protected removeThinkingMessage(response: string): string {
    if (response.includes("<think>")) {
      response = response.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
    }
    return response;
  }

  // Check if the question is a follow-up question
  protected isFollowUpQuestion(userInput: string, toolName: string): boolean {
    let keywords = [];
    const weatherKeywords = [
      "compare",
      "warmer",
      "colder",
      "rainy",
      "rain",
      "temperature",
      "condition",
      "forecast",
      "storm",
      "wind",
      "humidity",
      "sunny",
      "cloudy",
      "snow",
      "thunderstorm",
    ];

    switch (toolName) {
      case TOOL_NAMES.WEATHER_TOOL:
        keywords = weatherKeywords;
        break;
      default:
        break;
    }

    const isFollowUp = super.isFollowUpQuestion(
      userInput,
      toolName,
      keywords,
      this.context.lastToolUsed,
      this.context.lastToolData
    );
    return isFollowUp;
  }

  // Handle follow-up questions based on previous data
  protected async handleFollowUpQuestion(userInput: string, toolName: string) {
    return await super.handleFollowUpQuestion(
      userInput,
      toolName,
      this.context.lastToolUsed,
      this.context.lastToolData,
      this.aiToolsModule,
      this.context.isLLMInit
    );
  }

  // Get user input method
  private async getUserInput(): Promise<string> {
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "userInput",
        message: "Enter your input:",
      },
    ]);
    return answers.userInput;
  }
}
