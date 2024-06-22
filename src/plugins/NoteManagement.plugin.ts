import { Document } from "@langchain/core/documents";
import { CassandraStore } from "@langchain/community/vectorstores/cassandra";
import CassandraVectorDatabase from "../database/CassandraVectorDatabase.js";
import AiPlugin from "./Plugin.js";

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
    idCounter:number = 0;

    constructor(vectorProvider: CassandraVectorDatabase) {
      this.vectorProvider = vectorProvider;
      this.vectorStore = vectorProvider.connect();
    }
  
    public async storeNote(note: INote): Promise<Boolean> {
      // Add documents to vector store
      const isInserted = await this.vectorProvider.insertJsonDocument(
        note
      );
      if (isInserted) {
        console.log("Note is stored.");
      } else {
        console.log("Note is not stored.");
      }
  
      return isInserted;
    }
  
    // Function to query notes
    public async queryNotes(keyword: string, topN: number = 5): Promise<Document<Record<string, any>>[]> {
      if (!this.vectorStore) throw new Error("Database not connected.");
  
      try {
        // Convert the keyword to a vector using embeddings
        const keywordVector = await this.vectorProvider.embeddings.embedQuery(keyword);
        // Perform a vector-based search
        const searchResults = await this.vectorProvider.searchVector(keywordVector, topN);
        const matchingDocuments = searchResults.map((result) => result[0]);
        return matchingDocuments;
      } catch (err) {
        console.error("Error during keyword search:", err);
        return [];
      }
    }
  }
  