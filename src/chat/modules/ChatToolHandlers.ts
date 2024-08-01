import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { ITool } from "../../modules/aiTools/AiTools";
import NoteManagementPlugin, {
  INote,
} from "../../plugins/NoteManagement.plugin";
import Api, { ApiMethods } from "../../utils/Api";
import logger from "../../utils/Logger";
import Chat from "../chat.RAG";

export default class ChatToolHandlers {
  protected ragInstance: Chat;
  constructor(ragInstance: Chat) {
    if (!ragInstance) {
      throw new Error("Invalid Chat instance provided to ChatToolHandlers.");
    }
    this.ragInstance = ragInstance;
  }

  public handleCourseTool(userInput: string) {
    const evaluatedStream = this.ragInstance.jsonEvaluator(userInput);
    return evaluatedStream;
  }

  // Handle time tool
  public handleTimeTool(userInput: string, toolJson: ITool) {
    if (!this.ragInstance) {
      throw new Error("ragInstance is not defined");
    }

    toolJson.toolArgs.dateTime = new Date().toLocaleString();
    const evaluatedStream = this.ragInstance.jsonEvaluator(
      JSON.stringify(toolJson),
      userInput
    );
    return evaluatedStream;
  }

  // Handle weather tool input
  public async handleWeatherTool(userInput: string, toolJson: ITool) {
    if (!this.ragInstance) {
      throw new Error("ragInstance is not defined");
    }

    const weatherAPI = new Api("Weather API", async () => {
      const location = toolJson.toolArgs.location;
      const weatherData = await ApiMethods.fetchWeatherData(
        location ? location : "No location provided."
      );
      return weatherData;
    });
    const apiResponse = await weatherAPI.execute();
    const evaluatedStream = this.ragInstance.jsonEvaluator(
      JSON.stringify(apiResponse),
      userInput
    );
    return evaluatedStream;
  }

  // Handle note tool input
  public async handleNoteTool(userInput: string, toolJson: ITool) {
    if (!this.ragInstance) {
      throw new Error("ragInstance is not defined");
    }

    const noteManagement: NoteManagementPlugin =
      this.ragInstance.noteManagementPlugin;

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
        logger.log("New note is added. Note=", toolJson);
      } else {
        logger.warn("New note could not be added.");
      }
    } else if (actionType === "get") {
      const optimizedInput = await this.ragInstance.queryOptimizer(userInput);
      const results = await noteManagement.queryNotes(optimizedInput);
      const pageContent = results.map((doc) => doc.pageContent).join("");
      return pageContent;
    }
  }

  // Handle default tool (chat)
  public handleDefaultTool(userInput: string, init: boolean) {
    if (!this.ragInstance) {
      throw new Error("ragInstance is not defined");
    }

    const prompt = ``;
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
