import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { IterableReadableStream } from "@langchain/core/utils/stream";
import NoteManagementPlugin, {
  INote,
} from "../../plugins/NoteManagement.plugin";
import Api, { ApiMethods } from "../../utils/Api";
import { ITool } from "./AiTools";
import Chat from "../../chat.RAG";

export default class AiToolsModule {
  protected ragInstance: Chat;

  constructor(app: Chat) {
    this.ragInstance = app;
  }

  // Handle tool input (common method for weather_tool and note_tool)
  public async handleToolInput(
    userInput: string,
    toolName: string,
    actionHandler: (
      userInput: string,
      toolJson: ITool
    ) => Promise<IterableReadableStream<String>> | Promise<string>
  ) {
    this.ragInstance.conversationHistory.push(new HumanMessage(userInput));

    const toolJson: ITool = await this.ragInstance.buildTool(
      userInput,
      this.ragInstance.aiTools.getTool(toolName)
    );

    const response = await actionHandler(userInput, toolJson);

    return response;
  }

  // Handle weather tool input
  public handleCourseTool(userInput: string) {
    const actionHandler = (userInput: string) => {
      const evaluatedStream = this.ragInstance.jsonEvaluator(userInput);
      return evaluatedStream;
    };

    return this.handleToolInput(userInput, "course_tool", actionHandler);
  }

  // Handle weather tool input
  public async handleWeatherTool(userInput: string) {
    const actionHandler = async (userInput: string, toolJson: ITool) => {
      const weatherAPI = new Api("Weather API", async () => {
        const weatherData = await ApiMethods.fetchWeatherData(
          toolJson.toolArgs.location
        );
        return weatherData;
      });
      const apiResponse = await weatherAPI.execute();
      const evaluatedStream = this.ragInstance.jsonEvaluator(
        JSON.stringify(apiResponse),
        userInput
      );
      return evaluatedStream;
    };

    return this.handleToolInput(userInput, "weather_tool", actionHandler);
  }

  // Handle note tool input
  public async handleNoteTool(userInput: string) {
    const actionHandler = async (userInput: string, toolJson: ITool) => {
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
          console.log("New note is added. Note=", toolJson);
        } else {
          console.warn("New note could not be added.");
        }
      } else if (actionType === "get") {
        const optimizedInput = await this.ragInstance.queryOptimizer(userInput);
        const results = await noteManagement.queryNotes(optimizedInput);
        const pageContent = results.map((doc) => doc.pageContent).join("");
        return pageContent;
      }
    };

    return this.handleToolInput(userInput, "note_tool", actionHandler);
  }

  // Handle default tool (chat)
  public handleDefaultTool(userInput: string) {
    const prompt = `You are a virtual assistant and have few available tools your boss to use. Tools: ${this.ragInstance.aiTools.listTools()}`;
    this.ragInstance.conversationHistory.push(new HumanMessage(userInput));

    const stream = this.ragInstance.chatModel.stream([
      new SystemMessage(prompt),
      ...this.ragInstance.conversationHistory,
    ]);

    return stream;
  }
}
