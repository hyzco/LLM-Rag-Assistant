import RAG from "../src/RAG";
import logger from "../src/utils/Logger";
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import AiTools, { ITool } from "../src/modules/aiTools/AiTools";
import CassandraVectorDatabase from "../src/database/CassandraVectorDatabase";
import NoteManagementPlugin from "../src/plugins/NoteManagement.plugin";
import initializeApplication from "../src/config/Initializers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

jest.mock("../src/database/CassandraVectorDatabase");
jest.mock("../src/plugins/NoteManagement.plugin");
jest.mock("@langchain/community/chat_models/ollama");
jest.mock("../src/utils/Logger");
initializeApplication("test");

describe("RAG Class", () => {
  let rag: RAG;

  beforeAll(() => {
    rag = new RAG();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("constructor should initialize correctly", () => {
    expect(rag.aiTools).toBeInstanceOf(AiTools);
    expect(rag.noteManagementPlugin).toBeInstanceOf(NoteManagementPlugin);
    expect(rag.chatModel).toBeNull();
    expect(rag.conversationHistory).toEqual([]);
  });

  test("build method should initialize chat model", async () => {
    await rag.build();
    expect(rag.chatModel).toBeDefined();
    expect(ChatOllama).toHaveBeenCalledWith({
      baseUrl: process.env.OLLAMA_HOST,
      model: process.env.DEFAULT_MODEL,
    });
    expect(logger.info).toHaveBeenCalledWith("Chat model is built.");
  });

  test("validateToolSelection should return correct validation result", async () => {
    rag.chatModel.invoke = jest.fn().mockResolvedValue({
      content: "yes",
    });

    const isValid = await rag.validateToolSelection("test input", "mockTool");

    expect(isValid).toBe(true);
    expect(rag.chatModel.invoke).toHaveBeenCalled();
  });

  test("determineTool should return the appropriate tool", async () => {
    rag.chatModel.invoke = jest.fn().mockResolvedValue({
      content: "mockTool",
    });

    const mockValidateToolSelection = jest.spyOn(rag, "validateToolSelection");
    mockValidateToolSelection.mockResolvedValue(true);

    const toolName = await rag.determineTool("test input");

    expect(toolName).toBe("mockTool");
    expect(rag.chatModel.invoke).toHaveBeenCalled();
    expect(mockValidateToolSelection).toHaveBeenCalledWith(
      "test input",
      "mockTool"
    );
  });

  test("buildTool should return built tool options for generic tool", async () => {
    const mockTool: ITool = { toolName: "mockTool", toolArgs: { key: "value" }, toolDescription: "Mock tool for testing." };
    rag.aiTools.getTool = jest.fn().mockReturnValue(mockTool);
    rag.chatModel.invoke = jest.fn().mockResolvedValue({
      content: JSON.stringify(mockTool),
    });
    
    const userInput = "Some user input for testing";
    const toolOptions = await rag.buildTool(userInput, mockTool);

    expect(toolOptions).toEqual(mockTool);
    expect(logger.info).toHaveBeenCalledWith("Tool build is success.");
    expect(rag.chatModel.invoke).toHaveBeenCalled();
  });

  test("jsonEvaluator should return a short outcome", async () => {
    const mockJson = '{ "key": "value" }';
    const mockResponse = "Summary of the data";
    
    rag.chatModel.invoke = jest.fn().mockResolvedValue({
      content: mockResponse,
    });

    const result = await rag.jsonEvaluator(mockJson);
    
    const values = [];
    for await (const value of result) {
      values.push(value);
    }

    expect(values).toContain(mockResponse);
    expect(rag.chatModel.invoke).toHaveBeenCalled();
  });

  test("queryOptimizer should return optimized query", async () => {
    const mockResponse = "short query";

    rag.chatModel.invoke = jest.fn().mockResolvedValue({
      content: mockResponse,
    });

    const optimizedQuery = await rag.queryOptimizer("This is a long query");

    expect(optimizedQuery).toBe(mockResponse);
    expect(rag.chatModel.invoke).toHaveBeenCalled();
  });
});
