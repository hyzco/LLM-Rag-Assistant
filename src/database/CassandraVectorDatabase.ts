import { CassandraStore } from "@langchain/community/vectorstores/cassandra";
import { Document } from "@langchain/core/documents";
import { VectorDatabaseProvider } from "./VectorDatabaseProvider.js";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";

export default class CassandraVectorDatabase implements VectorDatabaseProvider {
  public vectorStore: CassandraStore | null = null;
  private config: any;
  private idCounter: number = 0; // Initialize ID counter
  public embeddings = new OllamaEmbeddings({
    model: process.env.DEFAULT_MODEL,
    baseUrl: process.env.OLLAMA_HOST,
    requestOptions: {
      useMMap: true,
      numThread: 4,
      numGpu: 1,
    },
  });

  constructor() {
    const configConnection = {
      serviceProviderArgs: {
        astra: {
          endpoint: process.env.CASSANDRA_HOST,
          clientId: process.env.CASSANDRA_CLIENT_ID,
          secret: process.env.CASSANDRA_SECRET,
          token: process.env.CASSANDRA_TOKEN,
        },
      },
    };
    this.config = {
      ...configConnection,
      keyspace: "eva_chat",
      dimensions: 4096,
      table: "test6",
      indices: [{ name: "title", value: "(title)" }],
      primaryKey: {
        name: "id",
        type: "int",
      },
      metadataColumns: [
        {
          name: "title",
          type: "text",
        },
      ],
      maxConcurrency: 25,
      // batchSize: 1,
    };
  }

  //TODO remove unused
  insertVector(
    vector: number[],
    metadata: Record<string, any>
  ): Promise<number> {
    throw new Error("Method not implemented.");
  }
  deleteVector(vectorId: number): boolean {
    throw new Error("Method not implemented.");
  }

  connect() {
    this.vectorStore = new CassandraStore(this.embeddings, this.config);
    return this.vectorStore;
  }

  async insertDocument(document: Document): Promise<Boolean> {
    try {
      if (!this.vectorStore) throw new Error("Database not connected.");
      await this.vectorStore.addDocuments([document]);
      return true;
    } catch (err) {
      if (err) {
        console.error(err);
        return false;
      }
    }
  }

  async insertJsonDocument(
    jsonDocument: Record<string, any>
  ): Promise<Boolean> {
    try {
      const metadata = {
        id: Math.floor(Math.random() * 1000000), // Adjust 1000000 based on your needs
        title: jsonDocument.title,
      };
      const document = new Document({
        pageContent: JSON.stringify(jsonDocument),
        metadata,
      });

      return await this.insertDocument(document);
    } catch (error) {
      console.log(error);
    }
  }
  async insertPlainTextDocument(plainText: string): Promise<Boolean> {
    const metadata = {
      id: this.idCounter++, // Increment ID counter for each new document
      title: plainText,
      timestamp: new Date().toISOString(),
    };
    const document = new Document({ pageContent: plainText, metadata });
    return await this.insertDocument(document);
  }

  async searchVector(
    vector: number[],
    topN: number = 10,
    filters?: Record<string, any>
  ) {
    if (!this.vectorStore) throw new Error("Database not connected.");

    try {
      const response = await this.vectorStore.similaritySearchVectorWithScore(
        vector,
        topN,
        filters
      );
      return response;
    } catch (err) {
      console.error("Error during search:", err);
      return [];
    }
  }
  async close(): Promise<void> {
    if (this.vectorStore) {
      // await this.vectorStore.close();
      this.vectorStore = null;
    }
  }
}
