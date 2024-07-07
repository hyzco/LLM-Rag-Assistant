import { BaseMessageChunk, HumanMessage } from "@langchain/core/messages";
import inquirer, { PromptModule } from "inquirer";
import RAG from "./RAG";
import { IterableReadableStream } from "@langchain/core/utils/stream";
import WebSocketModule from "./modules/WebSocketModule";
import AiToolsModule from "./modules/aiTools/AiToolsModule";
import logger from "./utils/Logger";

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
  private context: Context = {
    isLLMInit: true,
    lastToolUsed: null,
    lastToolData: null,
  };
  protected inquirer: PromptModule;
  protected webSocketModule: WebSocketModule;
  protected aiToolsModule: AiToolsModule;

  constructor() {
    super();
    this.inquirer = inquirer.createPromptModule();
    this.webSocketModule = new WebSocketModule(8080);
    this.aiToolsModule = new AiToolsModule(this);
  }

  // Process user input with context tracking
  public async processUserInput(socketInput: string | null = null) {
    try {
      const userInput =
        socketInput != null ? socketInput : await this.getUserInput();
      const toolName: string = await this.determineTool(userInput);

      if (toolName) {
        logger.log(`Determined tool: ${toolName}`);
        const response = await this.getResponse(toolName, userInput);
        logger.log("response: ", response);
        if (response) {
          this.conversationHistory.push(new HumanMessage(response));
          this.webSocketModule.sendMessageToClients(response);
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
  private async getResponse(
    toolName: string,
    userInput: string
  ): Promise<string | void> {
    let response: string | IterableReadableStream<String | BaseMessageChunk>;

    if (this.isFollowUpQuestion(userInput, toolName)) {
      console.log("is follow up question?", "yes");
      response = await this.handleFollowUpQuestion(userInput, toolName);
    } else {
      switch (toolName.trim()) {
        case TOOL_NAMES.WEATHER_TOOL:
          response = await this.aiToolsModule.handleWeatherTool(userInput);
          break;
        case TOOL_NAMES.CALENDAR_TOOL:
          logger.log("Tool has no method definition.");
          break;
        case TOOL_NAMES.NOTE_TOOL:
          response = await this.aiToolsModule.handleNoteTool(userInput);
          break;
        case TOOL_NAMES.COURSE_TOOL:
          response = await this.aiToolsModule.handleCourseTool(userInput);
          break;
        case TOOL_NAMES.TIME_TOOL:
          response = await this.aiToolsModule.handleTimeTool(userInput);
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

    return await this.convertResponseToString(response);
  }

  // Convert response to string if it is iterable
  protected convertResponseToString(
    response: string | IterableReadableStream<String | BaseMessageChunk>
  ) {
    return super.convertResponseToString(response);
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
