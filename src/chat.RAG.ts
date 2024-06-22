import { AIMessage } from "@langchain/core/messages";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import NoteManagementPlugin, {
  INote,
} from "./plugins/NoteManagement.plugin.js";
import RAG from "./RAG.js";
import { ITool } from "./AiTools.js";
import Api, { ApiMethods } from "./utils/Api.js";

import inquirer, { PromptModule } from "inquirer";

class Chat extends RAG {
  protected inquirer: PromptModule;

  constructor() {
    super();
    this.inquirer = inquirer.createPromptModule();
  }

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

  public async processUserInput() {
    const userInput = await this.getUserInput();
    const toolName: string = await this.determineTool(userInput);

    if (toolName) {
      console.log(toolName);

      switch (toolName) {
        case "weather_tool":
          console.log(await this.weatherToolWrapper(userInput, toolName));
          break;
        case "calendar_tool":
          console.log("Method definition is not implemented.");
          break;
        case "note_tool":
          console.log(await this.noteToolWrapper(userInput, toolName));
          break;
        default:
          console.log(await this.chat(userInput));
          break;
      }
    } else {
      console.log("No appropriate tool found for the given input.");
    }
  }

  private async chat(userMessage: string) {
    const prompt = `You are a virtual assistant.`;
    this.conversationHistory.push(new HumanMessage(userMessage));

    const chainResponse = await this.chatModel.invoke([
      new SystemMessage(prompt),
      ...this.conversationHistory,
    ]);
    const content = chainResponse.content.toString().trim();
    return content;
  }

  private async noteToolWrapper(userInput: string, toolName: string) {
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

    const isValidNote = Object.values(note).filter(
      (val) => typeof val === "string"
    );

    if (actionType === "save" && isValidNote) {
      const isStored = await noteManagement.storeNote(note);
      if (isStored) {
        console.log("New note is added. Note= ", toolJson);
      } else {
        console.warn("New note could not be added.");
      }
      return isStored;
    } else if (actionType === "get") {
      const optimizedInput = await this.queryOptimizer(userInput);
      const results = await noteManagement.queryNotes(optimizedInput);
      const pageContent = results.map((doc) => doc.pageContent);
      return pageContent;
    }
  }

  private async weatherToolWrapper(userInput: string, toolName: string) {
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
    const apiRespnose = await weatherAPI.execute();
    const evaluatedResponse = await this.jsonEvaluator(
      JSON.stringify(apiRespnose)
    );
    const weatherMessage = new AIMessage(
      `Sure, here is the weather information: ${evaluatedResponse} Can I help you with anything else?`
    );
    this.conversationHistory.push(weatherMessage);
    return weatherMessage.content;
  }

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

new Chat().buildApp();
