// Define the ITool interface
export interface ITool {
  toolName: string;
  toolDescription: string;
  toolArgs: {
    [key: string]: any;
  };
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

  constructor(toolConfig: ITool) {
    this.toolName = toolConfig.toolName || "[IGNORED]";
    this.toolDescription = toolConfig.toolDescription || "[IGNORED]";
    this.toolArgs = toolConfig.toolArgs || {};
  }

  toString() {
    return JSON.stringify({
      toolName: this.toolName,
      toolDescription: this.toolDescription,
      toolArgs: this.toolArgs,
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
    return this.tools.find((tool) => tool.toolName === name);
  }

  getAllTools(): ITool[] {
    return this.tools;
  }
}

export default class AiTools extends Tools {
  constructor() {
    super();
    this.addTool(this.weatherTool());
    this.addTool(this.calendarTool());
    this.addTool(this.noteTool());
  }

  private weatherTool() {
    const tool: ITool = {
      toolName: "weather_tool",
      toolDescription:
        "Provides current weather information for a given location.",
      toolArgs: { location: "" },
    };

    return new Tool(tool);
  }

  private calendarTool() {
    const tool: ITool = {
      toolName: "calendar_tool",
      toolDescription:
        "Provides functionality to update the all calendar and time management related tasks.",
      toolArgs: { action_type: "" },
    };

    return new Tool(tool);
  }

  private noteTool() {
    const tool: ITool = {
      toolName: "note_tool",
      toolDescription:
        "Tool to save or get note from the user. Only action types are 'save' or 'get'. Respond without quotes.",
      toolArgs: { action_type: "", title:"", content: "" },
    };

    return new Tool(tool);
  }
}
