import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { CassandraStore } from "@langchain/community/vectorstores/cassandra";
import { CassandraCRUDOperations } from "./CassandraCRUDOperations";
import { CassandraClient } from "./CassandraClient";
import { DocumentOperations } from "./DocumentOperations";
import { VectorSearch } from "./VectorSearch";
import { Client } from "cassandra-driver";

export default class CassandraVectorDatabase {
  private static _instance: CassandraVectorDatabase;
  public vectorStore: CassandraStore;
  public embeddings = new OllamaEmbeddings({
    model: process.env.DEFAULT_MODEL,
    baseUrl: process.env.OLLAMA_HOST,
    requestOptions: {
      useMMap: true,
      numThread: 4,
      numGpu: 1,
    },
  });

  public crud: CassandraCRUDOperations;
  public documentOperations: DocumentOperations;
  public vectorSearch: VectorSearch;
  public client: Client;

  private constructor() {
    try {
      CassandraClient.initialize();

      const config = {
        serviceProviderArgs: {
          astra: {
            endpoint: process.env.CASSANDRA_HOST,
            clientId: process.env.CASSANDRA_CLIENT_ID,
            secret: process.env.CASSANDRA_SECRET,
            token: process.env.CASSANDRA_TOKEN,
          },
        },
        keyspace: CassandraClient.keySpace,
        dimensions: 4096,
        table: "eva_notes",
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

      const codeConfig = {
        ...config,
        table: "code_documents",
        indices: [
          { name: "source", value: "(source)" },
          { name: "language", value: "(language)" },
        ],
        primaryKey: {
          name: "id",
          type: "int",
        },
        metadataColumns: [
          {
            name: "source",
            type: "text",
          },
          {
            name: "language",
            type: "text",
          },
        ],
      };

      this.vectorStore = new CassandraStore(this.embeddings, codeConfig);
      this.documentOperations = new DocumentOperations(this.vectorStore);
      this.vectorSearch = new VectorSearch(this.vectorStore);
      this.client = CassandraClient.initialize();
      this.crud = new CassandraCRUDOperations(this.client);
    } catch (error) {
      console.error("Error while initializing Cassandra client: " + error);
    }
  }

  public static getInstance() {
    if (!this._instance) {
      this._instance = new CassandraVectorDatabase();
    }
    return this._instance;
  }

  connect() {
    return this.vectorStore;
  }

  async close(): Promise<void> {
    if (this.vectorStore) {
      // await this.vectorStore.close();
      this.vectorStore = null;
    }
  }
}
