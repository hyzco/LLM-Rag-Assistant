import { IterableReadableStream } from "@langchain/core/utils/stream";
import { ITool } from "./AiTools";

export interface Registry {
  tool: ITool;
  handler: (
    userInput: string,
    toolJson: ITool
  ) => Promise<IterableReadableStream<string>> | Promise<string>;
}

export interface IToolRegistry {
  getTool(name: string): Registry;
  registerTool(registry: Registry): void;
}

export type IToolsRegistry = Map<string, Registry>;

export default class ToolRegistry implements IToolRegistry {
  private tools: IToolsRegistry = new Map();

  getTool(name: string): Registry {
    return this.tools.get(name);
  }

  registerTool(registry: Registry): void {
    const { tool, handler } = registry;
    if (tool.toolName && tool.toolDescription) {
      this.tools.set(tool.toolName, { tool, handler });
    } else {
      throw new Error("Invalid tool. Missing toolName or toolDescription.");
    }
  }
}
