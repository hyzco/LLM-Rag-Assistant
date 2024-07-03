import { CassandraStore } from "@langchain/community/vectorstores/cassandra";

export class VectorSearch {
  private vectorStore: CassandraStore;

  constructor(vectorStore: CassandraStore) {
    this.vectorStore = vectorStore;
  }

  async search(
    vector: number[],
    topN: number = 10,
    filters?: Record<string, any>
  ) {
    
    if (!this.vectorStore) {
      throw new Error("Database not connected for vector search.");
    }

    try {
      const response = await this.vectorStore.similaritySearchVectorWithScore(
        vector,
        topN,
        filters
      );
      return response;
    } catch (err) {
      console.error("Error during vector search:", err);
      return [];
    }
  }
}
