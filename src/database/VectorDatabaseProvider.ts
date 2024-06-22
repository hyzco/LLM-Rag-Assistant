import { Document } from "@langchain/core/documents";

export interface VectorDatabaseProvider {
    connect(): void;
    insertVector(vector: number[], metadata: Record<string, any>):  Record<string, any>;
    searchVector(vector: number[], topN?: number, filters?: Record<string, any>): Promise<[Document<Record<string, any>>, number][]>;
    deleteVector(vectorId: number): boolean;
    close(): void;
}

// import { Document } from "@langchain/core/documents";

// export interface VectorDatabaseProvider {
//   connect(): void;
//   insertDocument(document: Document): Promise<boolean>;
//   insertJsonDocument(jsonDocument: Record<string, any>): Promise<boolean>;
//   insertPlainTextDocument(plainText: string, metadata: Record<string, any>): Promise<boolean>;
//   searchVector(vector: number[], topN?: number, filters?: Record<string, any>): Promise<[Document, number][]>;
//   queryNotes(keyword: string, topN?: number): Promise<Document[]>;
//   close(): Promise<void>;
// }
