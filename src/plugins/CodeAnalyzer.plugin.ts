import { Document } from "@langchain/core/documents";
import { CassandraStore } from "@langchain/community/vectorstores/cassandra";
import CassandraVectorDatabase from "../database/CassandraVectorDatabase";
import AiPlugin from "./Plugin";
import logger from "../utils/Logger";

import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import {
  JSONLoader,
  JSONLinesLoader,
} from "langchain/document_loaders/fs/json";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import RAG from "../RAG";
import { CassandraClient } from "../database/CassandraClient";
import initializeApplication from "../config/Initializers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";

initializeApplication("development");
// Interface for structured elements (classes, methods, etc.)
interface StructuredElement {
  type: string;
  name: string;
}
export default class CodeAnalyzerPlugin implements AiPlugin {
  name: string;
  description: string;
  vectorProvider: CassandraVectorDatabase;
  vectorStore: CassandraStore;
  idCounter: number = 0;

  constructor(vectorProvider: CassandraVectorDatabase) {
    this.vectorProvider = vectorProvider;
    this.vectorStore = vectorProvider.connect();
  }

  public analyzeCode = async (userInput: string) => {
    await this.saveProjectToVectorStore(this.projectLoader());

    if (!this.vectorStore) throw new Error("Database not connected.");

    try {
      const gradedDocuments = (await this.gradeDocuments(userInput))
        .sort((a, b) => (a.relevanceScore > b.relevanceScore ? 1 : 0))
        .slice(0, 3);

      const content = gradedDocuments
        .map((doc) => {
          return {
            content: doc.document.pageContent,
            source: doc.document.metadata.source,
            rating: doc.relevanceScore,
          };
        })
        .filter((item) => !item.source.includes("CodeAnalyzer"));

      console.log("CONTENT", content);
      const prompt = ChatPromptTemplate.fromMessages([
        new SystemMessage(
          `Generate TypeScript code based on the following context:\n\n` +
            `User Input: ${userInput}\n` +
            `Content Context: ${JSON.stringify(content)}\n` +
            `Provide TypeScript code that enhances or extends the functionality of the existing code. Focus on optimizing performance or improving readability.`
        ),
      ]);

      const rag = new RAG();
      rag.build();
      const chain = prompt.pipe(rag.chatModel).pipe(new StringOutputParser());

      const response = await chain.invoke({});

      console.log("RESPONSE= ", response);
      return gradedDocuments;
    } catch (err) {
      console.error("Error during keyword search:", err);
      return [];
    }
  };

  private projectLoader = async () => {
    // Function to create a TextLoader for code files
    const CodeLoader = (path: string | Blob) => new TextLoader(path);

    const loader = new DirectoryLoader(
      "src", // Top-level directory
      {
        ".json": (path) => new JSONLoader(path),
        ".pdf": (path) => new PDFLoader(path),
        ".txt": (path) => new TextLoader(path),
        ".js": CodeLoader,
        ".ts": CodeLoader,
        // Add more extensions as needed
      }
    );

    const docs = await loader.load();
    return docs;
  };

  private saveProjectToVectorStore = async (
    loader: Promise<Document<Record<string, any>>[]>
  ) => {
    try {
      const resolvedDocs = await loader;
      const uniqueDocs = this.deduplicateDocsBySource(resolvedDocs);
      let counter = 0;

      for (const document of uniqueDocs) {
        try {
          const docId = `${++counter}`;
          document.metadata.id = docId;

          // Check if the document already exists in the vector store
          const exists = await this.vectorProvider.crud.selectRecord(
            "code_documents",
            Number(docId)
          );
          if (!exists) {
            // Insert the document into the vector store
            const success =
              await this.vectorProvider.documentOperations.insertDocument(
                document
              );
            if (success) {
              logger.log(`Document inserted to table.`);
            } else {
              throw new Error(`Document could not be added to table.`);
            }
          } else {
            logger.log(`Document already exists in the vector store.`);
          }
        } catch (error) {
          logger.error(
            "Document could not be inserted to vector store: ",
            error
          );
        }
      }
    } catch (error) {
      logger.error("Error loading documents: ", error);
    }
  };

  private deduplicateDocsBySource = (docs: Document<Record<string, any>>[]) => {
    const seenSources = new Set();
    const uniqueDocs = [];

    for (const doc of docs) {
      if (!seenSources.has(doc.metadata.source)) {
        seenSources.add(doc.metadata.source);
        uniqueDocs.push(doc);
      }
    }

    return uniqueDocs;
  };

  private gradeDocuments = async (userInput: string) => {
    const documents = await this.projectLoader();

    // Adjust how you parse the user input to handle structured queries like "RAG.class"
    const structuredQueryRegex = /([a-zA-Z0-9]+)\.class/gi;
    let match;
    const structuredQueries = [];
    while ((match = structuredQueryRegex.exec(userInput))) {
      structuredQueries.push(match[0]);
    }

    // Compute relevance score based on keyword occurrences in each document
    const gradedDocuments = documents.map((doc) => {
      // Extract text content and structured elements (classes, methods, etc.)
      const text = (doc.pageContent || "").toLowerCase();
      const structuredElements = this.extractStructuredElements(doc);

      // Compute relevance score based on keyword occurrences and structured elements
      let relevanceScore = 0;

      // Match keywords in the text content
      structuredQueries.forEach((query) => {
        const keyword = query.toLowerCase();
        const regex = new RegExp("\\b" + keyword + "\\b", "gi");
        const occurrences = (text.match(regex) || []).length;
        relevanceScore += occurrences;
      });

      // Match keywords in structured elements (classes, methods, etc.)
      structuredElements.forEach((element) => {
        structuredQueries.forEach((query) => {
          // Check if the element name matches the structured query
          if (query.toLowerCase() === element.name.toLowerCase()) {
            relevanceScore += 10; // Assign a higher score for exact matches
          }
        });
      });

      return {
        document: doc,
        relevanceScore,
      };
    });

    // Filter out documents with zero relevance score
    return gradedDocuments
      .filter((result) => result.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  };

  // Example method to extract structured elements (classes, methods, etc.) from document
  private extractStructuredElements(doc: Document): StructuredElement[] {
    // Implement logic to extract structured elements from the document
    // Example: extracting class names, method names, etc.
    const structuredElements: StructuredElement[] = [];

    // Example logic (you need to implement based on your document structure)
    const text = (doc.pageContent || "").toLowerCase();
    const classRegex = /class\s+(\w+)/gi;
    let match;
    while ((match = classRegex.exec(text))) {
      structuredElements.push({ type: "class", name: match[1] });
    }

    const methodRegex = /function\s+(\w+)/gi;
    while ((match = methodRegex.exec(text))) {
      structuredElements.push({ type: "method", name: match[1] });
    }

    console.log("structured elements", structuredElements);

    return structuredElements;
  }

  //   private computeRelevanceScore = (
  //     doc: Document<Record<string, any>>,
  //     keywords: any[]
  //   ) => {
  //     if (
  //       !doc ||
  //       !doc.pageContent ||
  //       !Array.isArray(keywords) ||
  //       keywords.length === 0
  //     ) {
  //       return 0;
  //     }

  //     const text = doc.pageContent.toLowerCase();
  //     let relevanceScore = 0;

  //     // Escape each keyword to handle special characters properly
  //     const escapedKeywords = keywords.map((keyword) =>
  //       keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  //     );
  //     const keywordRegex = new RegExp(
  //       "\\b(" + escapedKeywords.join("|") + ")\\b",
  //       "gi"
  //     );

  //     // Match all keywords in one go
  //     const matches = text.match(keywordRegex);

  //     if (matches) {
  //       relevanceScore = matches.length;
  //     }

  //     // Optionally, you might want to consider normalizing or adjusting the relevance score here
  //     // based on document length or other factors relevant to your scoring strategy.

  //     return relevanceScore;
  //   };
}

CassandraClient.keySpace = process.env["ASTRA_DB_KEY_SPACE"];
CassandraClient.secureConnectBundle =
  "./src/config/secure-connect-eva-chat.zip";

const plugin = new CodeAnalyzerPlugin(CassandraVectorDatabase.getInstance());
plugin
  .analyzeCode(
    "Create todo.RAG.class using RAG.class"
  )
  .then((gradedDocuments) => {
    // console.log("Graded documents", gradedDocuments);
  })
  .catch((error) => {
    console.error("Error analyzing code:", error);
  });
