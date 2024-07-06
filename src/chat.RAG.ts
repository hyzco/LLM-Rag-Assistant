import { BaseMessageChunk, HumanMessage } from "@langchain/core/messages";
import inquirer, { PromptModule } from "inquirer";
import RAG from "./RAG.js";
import { IterableReadableStream } from "@langchain/core/utils/stream";
import WebSocketModule from "./modules/WebSocketModule.js";
import AiToolsModule from "./modules/aiTools/AiToolsModule.js";
import logger from "./utils/Logger.js";

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
        if (response) {
          this.conversationHistory.push(new HumanMessage(response));
          this.webSocketModule.sendMessageToClients(response);
        } else {
          logger.log("We had troubles here to retrieve response from LLM. Try again.");
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

    if (this.isFollowUpQuestion(userInput)) {
      response = await this.handleFollowUpQuestion(userInput);
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
          response = await this.aiToolsModule.handleDefaultTool(userInput, this.context.isLLMInit);
          this.context.isLLMInit = false;
          break;
      }
      this.context.lastToolUsed = toolName.trim();
      this.context.lastToolData = response;
    }

    return await this.convertResponseToString(response);
  }

  // Convert response to string if it is iterable
  private async convertResponseToString(
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

  // Check if the question is a follow-up question
  private isFollowUpQuestion(userInput: string): boolean {
    if (this.context.lastToolUsed && this.context.lastToolData) {
      if (this.context.lastToolUsed === "weather_tool") {
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
        const pattern = new RegExp(weatherKeywords.join("|"), "i");
        return pattern.test(userInput);
      }
    }

    return false;
  }

  // Handle follow-up questions based on previous data
  private async handleFollowUpQuestion(userInput: string) {
    if (
      this.context.lastToolUsed === "weather_tool" &&
      this.context.lastToolData
    ) {
      const data = this.context.lastToolData;
      const prompt = `Handle the follow-up question after tool usage based on user input and tool data. User input: ${userInput} Previous tool data: ${data}. Respond short, precise.`;
      const response = this.aiToolsModule.handleDefaultTool(prompt, this.context.isLLMInit);
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
