import AiTools, { ITool, Tool } from "../../modules/aiTools/AiTools";

export default class ChatTools extends AiTools<ITool> {
  constructor() {
    super();
    [
      "Never assume.",
      "Always give short answers.",
      "You are a voice assistant so your answers should be understood and simple.",
    ].forEach((rule) => this.addRule(rule));

    this.addTool(this.weatherTool());
    this.addTool(this.timeTool());
    this.addTool(this.calendarTool());
    this.addTool(this.noteTool());
    this.addTool(this.courseTool());
  }

  public weatherTool(): ITool {
    const tool: ITool = {
      toolRules: this.listRules(),
      toolName: "weather_tool",
      toolDescription:
        "Provides current weather information for a given location. If there is secondary location mentioned, checks if chat history contains the information.",
      toolArgs: { location: "" },
    };

    return new Tool(tool);
  }

  public timeTool() {
    const tool: ITool = {
      toolRules: this.listRules(),
      toolName: "time_tool",
      toolDescription:
        "Provides functionality to return date time information from tool args.",
      toolArgs: { dateTime: "" },
    };

    return new Tool(tool);
  }

  public calendarTool() {
    const tool: ITool = {
      toolRules: this.listRules(),
      toolName: "calendar_tool",
      toolDescription:
        "Provides functionality to update the all calendar and time management related tasks.",
      toolArgs: { action_type: "" },
    };

    return new Tool(tool);
  }

  public noteTool() {
    const tool: ITool = {
      toolRules: this.listRules(),
      toolName: "note_tool",
      toolDescription:
        "Tool to save or get note from the user. Only action types are 'save' or 'get'. Respond without quotes.",
      toolArgs: { action_type: "", title: "", content: "" },
    };

    return new Tool(tool);
  }

  public courseTool() {
    const tool: ITool = {
      toolRules:
        "Give long course modules, every page should contain as much as text to fill A4 paper.",
      toolName: "course_creator",
      toolDescription:
        "Tool to create extended course based on given user input, topic, target auidience and course format. Give your answers long, course should have extended information. No summary but actual long text.",
      toolArgs: { input: "", topic: "", targetAuidience: "", courseFormat: "" },
    };

    return new Tool(tool);
  }
}
