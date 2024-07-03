import { CassandraStore } from "@langchain/community/vectorstores/cassandra";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { CassandraClient } from "./CassandraClient.js";
import { DocumentOperations } from "./DocumentOperations.js";
import { VectorSearch } from "./VectorSearch.js";
import { CassandraCRUDOperations } from "./CassandraCRUDOperations.js";

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

  private constructor() {
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

    this.vectorStore = new CassandraStore(this.embeddings, config);
    this.documentOperations = new DocumentOperations(this.vectorStore);
    this.vectorSearch = new VectorSearch(this.vectorStore);
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
