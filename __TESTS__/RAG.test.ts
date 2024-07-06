import RAG from "../src/RAG";
import path from "path";
import logger from "../src/utils/Logger";
import initializeApplication from "../src/config/Initializers";
initializeApplication("test");

describe("RAG Class", () => {
  let rag: RAG;

  beforeAll(() => {
    rag = new RAG();
  });

  test("build method should initialize chat model", async () => {
    await rag.build();
    expect(rag.chatModel).toBeDefined();
    // Add more assertions as needed
  });

  // Add more tests for other methods similarly
});
