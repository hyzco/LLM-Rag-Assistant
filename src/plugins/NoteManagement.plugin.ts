import { Document } from "@langchain/core/documents";
import { CassandraStore } from "@langchain/community/vectorstores/cassandra";
import CassandraVectorDatabase from "../database/CassandraVectorDatabase.js";
import AiPlugin from "./Plugin.js";
import logger from "../utils/Logger.js";

export interface INote {
  id?: number;
  title: string;
  timestamp?: Date;
  content: string;
}

export default class NoteManagementPlugin implements AiPlugin {
  name: String;
  description: String;
  vectorProvider: CassandraVectorDatabase;
  vectorStore: CassandraStore;
  idCounter: number = 0;

  constructor(vectorProvider: CassandraVectorDatabase) {
    this.vectorProvider = vectorProvider;
    this.vectorStore = vectorProvider.connect();
  }

  public async storeNote(note: INote): Promise<Boolean> {
    // Add documents to vector store
    if (note.title === "" || note.content === "") {
      throw new Error("Note title and content is empty.");
    }

    note.timestamp = new Date();

    const isInserted =
      await this.vectorProvider.documentOperations.insertJsonDocument(note);
    if (isInserted) {
      logger.log("Note is stored.");
    } else {
      logger.log("Note is not stored.");
    }

    return isInserted;
  }

  // Function to query notes
  public async queryNotes(
    keyword: string,
    topN: number = 5
  ): Promise<Document<Record<string, any>>[]> {
    if (!this.vectorStore) throw new Error("Database not connected.");

    try {
      // Convert the keyword to a vector using embeddings
      const keywordVector = await this.vectorProvider.embeddings.embedQuery(
        keyword
      );
      // Perform a vector-based search
      const searchResults = await this.vectorProvider.vectorSearch.search(
        keywordVector,
        topN
      );
      const matchingDocuments = searchResults.map((result) => result[0]);
      return matchingDocuments;
    } catch (err) {
      console.error("Error during keyword search:", err);
      return [];
    }
  }
}
