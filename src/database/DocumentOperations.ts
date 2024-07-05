import { CassandraStore } from "@langchain/community/vectorstores/cassandra";
import { Document } from "@langchain/core/documents";

export class DocumentOperations {
  private idCounter: number = 0;
  private vectorStore: CassandraStore;

  constructor(vectorStore: CassandraStore) {
    this.vectorStore = vectorStore;
  }

  async insertDocument(document: Document): Promise<Boolean> {
    try {
      if (!this.vectorStore) {
        throw new Error("Database not connected for document operations.");
      }
      await this.vectorStore.addDocuments([document]);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  async insertJsonDocument(
    jsonDocument: Record<string, any>
  ): Promise<Boolean> {
    try {
      const metadata = {
        id: Math.floor(Math.random() * 1000),
        title: jsonDocument.title,
      };
      const document = new Document({
        pageContent: JSON.stringify(jsonDocument),
        metadata,
      });

      return await this.insertDocument(document);
    } catch (error) {
      console.error(error);
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
}
