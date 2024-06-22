// Import necessary modules and types
import { AIMessage } from "@langchain/core/messages";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import NoteManagementPlugin, {
  INote,
} from "./plugins/NoteManagement.plugin.js";
import RAG from "./RAG.js";
import { ITool } from "./AiTools.js";
import Api, { ApiMethods } from "./utils/Api.js";
import inquirer, { PromptModule } from "inquirer";

// Define the Chat class extending RAG
export default class Chat extends RAG {
  protected inquirer: PromptModule;

  constructor() {
    super();
    this.inquirer = inquirer.createPromptModule();
  }

  // Method to build and run the chat application
  public buildApp() {
    return (async () => {
      await this.build();
      let i = 0;
      while (i < 10) {
        await this.processUserInput();
        i++;
      }
      console.log("APP is terminated.");
      process.exit(0);
    })();
  }

  // Process user input method
  public async processUserInput() {
    try {
      const userInput = await this.getUserInput();
      const toolName: string = await this.determineTool(userInput);

      if (toolName) {
        switch (toolName) {
          case "weather_tool":
            await this.handleWeatherTool(userInput);
            break;
          case "calendar_tool":
            console.log("Tool has no method definition.")
            break;
          case "note_tool":
            await this.handleNoteTool(userInput);
            break;
          default:
            await this.handleDefaultTool(userInput);
            break;
        }
      } else {
        console.log("No appropriate tool found for the given input.");
      }
    } catch (error) {
      console.error("Error processing user input:", error);
    }
  }

  // Handle weather tool input
  private async handleWeatherTool(userInput: string) {
    const toolName = "weather_tool";
    const toolJson: ITool = await this.buildTool(
      userInput,
      this.aiTools.getTool(toolName)
    );
    const weatherAPI = new Api("Weather API", async () => {
      const weatherData = await ApiMethods.fetchWeatherData(
        toolJson.toolArgs.location
      );
      return weatherData;
    });
    const apiResponse = await weatherAPI.execute();
    const evaluatedResponse = await this.jsonEvaluator(
      JSON.stringify(apiResponse)
    );
    const weatherMessage = new AIMessage(
      `Sure, here is the weather information: ${evaluatedResponse}. Can I help you with anything else?`
    );
    this.conversationHistory.push(weatherMessage);
    console.log(weatherMessage.content);
  }

  // Handle note tool input
  private async handleNoteTool(userInput: string) {
    const toolName = "note_tool";
    const noteManagement: NoteManagementPlugin = this.noteManagementPlugin;
    const toolJson: ITool = await this.buildTool(
      userInput,
      this.aiTools.getTool(toolName)
    );

    const actionType = toolJson.toolArgs.action_type.toLowerCase();
    const note: INote = {
      title: toolJson.toolArgs.title,
      content: toolJson.toolArgs.content,
    };

    if (
      actionType === "save" &&
      typeof note.title === "string" &&
      typeof note.content === "string"
    ) {
      const isStored = await noteManagement.storeNote(note);
      if (isStored) {
        console.log("New note is added. Note=", toolJson);
      } else {
        console.warn("New note could not be added.");
      }
    } else if (actionType === "get") {
      const optimizedInput = await this.queryOptimizer(userInput);
      const results = await noteManagement.queryNotes(optimizedInput);
      const pageContent = results.map((doc) => doc.pageContent);
      console.log(pageContent);
    }
  }

  // Handle default tool (chat)
  private async handleDefaultTool(userInput: string) {
    const prompt = `You are a virtual assistant.`;
    this.conversationHistory.push(new HumanMessage(userInput));

    const chainResponse = await this.chatModel.invoke([
      new SystemMessage(prompt),
      ...this.conversationHistory,
    ]);
    const content = chainResponse.content.toString().trim();
    console.log(content);
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