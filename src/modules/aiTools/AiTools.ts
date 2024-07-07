// Define the ITool interface
export interface ITool {
  toolName: string;
  toolDescription: string;
  toolArgs?: {
    [key: string]: any;
  };
  toolRules?: string;
  toString?(): string;
}

// Define the ITools interface
export interface ITools {
  addTool(weatherTool: ITool): void;
  getTool(arg0: string): ITool;
  getAllTools(): ITool[];
}

// Implement the Tool class
class Tool implements ITool {
  toolName: string;
  toolDescription: string;
  toolArgs: { [key: string]: any };
  toolRules?: string;

  constructor(toolConfig: ITool) {
    this.toolName = toolConfig.toolName || "[IGNORED]";
    this.toolDescription = toolConfig.toolDescription || "[IGNORED]";
    this.toolArgs = toolConfig.toolArgs || {};
    this.toolRules = toolConfig.toolRules || "[IGNORED]";
  }

  toString() {
    return JSON.stringify({
      toolName: this.toolName,
      toolDescription: this.toolDescription,
      toolArgs: this.toolArgs,
      toolRules: this.toolRules,
    });
  }
}

// Implement the Tools class
class Tools implements ITools {
  tools: ITool[];

  constructor() {
    this.tools = [];
  }

  addTool(tool: ITool) {
    this.tools.push(tool);
  }

  getTool(name: string): ITool {
    if (name.toLowerCase() === "default")
      return new Tool({
        toolName: "default",
        toolDescription:
          "Default mode is chit chat mode, answers any question. Behaves friendly.",
      });
    return this.tools.find((tool) => tool.toolName === name) ;
  }

  getAllTools(): ITool[] {
    return this.tools;
  }
}

export default class AiTools extends Tools {
  private rules = [];
  constructor() {
    super();
    this.rules.push(
      "Never assume.",
      "Always give short answers.",
      "You are a voice assistant so your answers should be understood and simple."
    );

    this.addTool(this.weatherTool());
    this.addTool(this.timeTool());
    this.addTool(this.calendarTool());
    this.addTool(this.noteTool());
    this.addTool(this.courseTool());
  }

  public listTools() {
    return super
      .getAllTools()
      .map(
        (tool) =>
          `- ToolName: ${tool.toolName}; ToolDescription: ${tool.toolDescription};`
      )
      .join("\n");
  }

  private listRules() {
    return this.rules
      .map((rule, index) => `Rule nr ${index}: ${rule}`)
      .join("\n");
  }

  private weatherTool() {
    const tool: ITool = {
      toolRules: this.listRules(),
      toolName: "weather_tool",
      toolDescription:
        "Provides current weather information for a given location. If there is secondary location mentioned, checks if chat history contains the information.",
      toolArgs: { location: "" },
    };

    return new Tool(tool);
  }

  private timeTool() {
    const tool: ITool = {
      toolRules: this.listRules(),
      toolName: "time_tool",
      toolDescription:
        "Provides functionality to return date time information from tool args.",
      toolArgs: { dateTime: "" },
    };

    return new Tool(tool);
  }

  private calendarTool() {
    const tool: ITool = {
      toolRules: this.listRules(),
      toolName: "calendar_tool",
      toolDescription:
        "Provides functionality to update the all calendar and time management related tasks.",
      toolArgs: { action_type: "" },
    };

    return new Tool(tool);
  }

  private noteTool() {
    const tool: ITool = {
      toolRules: this.listRules(),
      toolName: "note_tool",
      toolDescription:
        "Tool to save or get note from the user. Only action types are 'save' or 'get'. Respond without quotes.",
      toolArgs: { action_type: "", title: "", content: "" },
    };

    return new Tool(tool);
  }

  private courseTool() {
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
