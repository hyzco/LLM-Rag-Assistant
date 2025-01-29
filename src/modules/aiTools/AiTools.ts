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

// Implement the Tool class
export class Tool implements ITool {
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
export default class AiTools<T extends ITool> {
  tools: T[];
  rules: Array<string>;

  constructor() {
    this.tools = [];
    this.rules = [];
  }

  addRule(rule: string) {
    this.rules.push(rule);
  }

  getAllRules() {
    return this.rules;
  }

  addTool(tool: T) {
    this.tools.push(tool);
  }

  getTool(name: string): ITool {
    console.log("(getTool) Tool name:", name);

    const foundTool = this.tools.find((tool) => tool.toolName === name);
    if (!foundTool) {
      console.log(`Tool with name ${name} not found.`);
      return new Tool({
        toolName: "default",
        toolDescription:
          "Default mode is chit chat mode, answers any question. Behaves friendly. Don't mention about tools, just be AI assistant.",
      });
    } else {
      console.log(`Tool with name ${name} found.`);
      return foundTool;
    }
  }

  getAllTools(): ITool[] {
    return this.tools;
  }

  listTools() {
    return this.getAllTools()
      .map(
        (tool) =>
          `- ToolName: ${tool.toolName}; ToolDescription: ${tool.toolDescription};`
      )
      .join("\n");
  }

  listToolNames() {
    const allTools = this.getAllTools();
    let toolNames = "";
    for (const tools of allTools) {
      toolNames += `Tool name: ${tools.toolName} \n`;
    }
    return toolNames;
  }

  listRules() {
    return this.rules
      .map((rule, index) => `Rule nr ${index}: ${rule}`)
      .join("\n");
  }
}
