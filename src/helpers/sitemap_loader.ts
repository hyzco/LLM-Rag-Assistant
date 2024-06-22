// import fs from "node:fs/promises";
// // =import { QdrantVectorStore } from "@langchain/community/vectorstores/qdrant";
// // import { QdrantVectorStore } from "@langchain/qdrant";
// import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
// import { SitemapLoader } from "@langchain/community/document_loaders/web/sitemap";
// import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
// import { SystemMessage, HumanMessage } from "@langchain/core/messages";
// import { StringOutputParser } from "@langchain/core/output_parsers";
// import { PromptTemplate, ChatPromptTemplate } from "@langchain/core/prompts";
// import { ChatOllama } from "@langchain/community/chat_models/ollama";
// import readline from "readline";

// const chatModel = new ChatOllama({
//   baseUrl: "http://192.168.1.17:11434", // Adjust this as necessary
//   model: "llama3",
// });

// // Timeout helper function
// const timeout = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// // Function to load a single URL with a timeout
// async function loadUrlWithTimeout(url: string, timeoutMs: number) {
//   try {
//     console.log(`Attempting to load URL: ${url}`);
//     const pages:any = await Promise.race([
//       new CheerioWebBaseLoader(url).load(),
//       timeout(timeoutMs)
//     ]);
//     if (!pages) {
//       throw new Error("Loading timed out");
//     }
//     console.log(`Successfully loaded URL: ${url}`);
//     return pages.map((page: { pageContent: string; }) => ({ pageContent: page.pageContent.replace(/\n/g, ""), url }));
//   } catch (error) {
//     console.error(`Failed to load URL: ${url}`, error);
//     return null;
//   }
// }

// async function askQuestion(question: string, context: string, metadata: any) {
//   console.log(question);
//   console.log(context);
//   const questionPrompt = await PromptTemplate.fromTemplate(
//     `Answer the question only using the context provided.
//     {question}
//     {context}
//     `
//   ).format({
//     question: question, context: context
//   });

//   // const systemPrompt = await PromptTemplate.fromTemplate(
//   //   `You are an English teacher provided with many documents on the English language from known resources.
//   //   Answer the questions based on the provided context and metadata only. Do not use any other knowledge you might have.
//   //   If you can't find the information in the given context, tell the student you don't know the answer. 
//   //   Always use response template to answer !
    
//   //   Context: {context}
//   //   Metadata: {metadata}

//   //   Response Template:
//   //   [AI]: [Your response here]
//   //   [SOURCE]: {metadata}
//   //   `
//   // ).format(
//   //   { context: context, metadata: metadata }
//   // );

//   const systemMessage = new SystemMessage("");
//   const userMessage = new HumanMessage(questionPrompt);

//   const prompt = ChatPromptTemplate.fromMessages([
//     systemMessage,
//     userMessage,
//   ]);

//   const chain = prompt.pipe(chatModel!).pipe(new StringOutputParser());

//   const result = await chain.invoke({});
//   return result;
// }

// async function optimizeContent(context: string): Promise<string> {
//   const questionPrompt = await PromptTemplate.fromTemplate(
//     `Optimize the document by removing unnecessary HTML content, website elements, and summarizing it without losing meaning and context. Please ensure that the optimized document maintains clarity and coherence. Content: {context}`
//   ).format({ context: context });

//   const systemMessage = new SystemMessage(
//     "You are a document optimizer. Your task is to refine the provided content by eliminating unnecessary HTML tags, website elements, and summarizing the text while preserving its meaning and context. Once optimized, return the revised document without any additional information."
//   );
//   const userMessage = new HumanMessage(questionPrompt);

//   const prompt = ChatPromptTemplate.fromMessages([
//     systemMessage,
//     userMessage,
//   ]);

//   const chain = prompt.pipe(chatModel!).pipe(new StringOutputParser());

//   const result = await chain.invoke({});
//   return result;
// }


// // Function to prompt user for input using readline
// async function promptUser(query: string) {
//   const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout,
//   });
//   return new Promise((resolve) => rl.question(query, (answer) => {
//     rl.close();
//     resolve(answer);
//   }));
// }

// async function main() {
//   const embeddings = new OllamaEmbeddings({
//     model: "llama3", // default value
//     baseUrl: "http://192.168.1.17:11434", // default value
//     requestOptions: {
//       useMMap: true, // use_mmap 1
//       numThread: 4, // num_thread 4
//       numGpu: 1, // num_gpu 1
//     },
//   });

//   const loader = new SitemapLoader("https://learnenglish.britishcouncil.org/sitemap.xml");
//   let sitemap: any[];

//   try {
//     console.log("Parsing sitemap...");
//     sitemap = await loader.parseSitemap();
//     console.log("Sitemap parsed successfully");
//   } catch (error) {
//     console.error("Failed to parse sitemap:", error);
//     return;
//   }

//   const filteredSiteMap = sitemap.filter((map: { loc: string | any[]; }) => map.loc.includes("email"));

//   const final = [];
//   let totalSize = 0;
//   let successfulLoads = 0;
//   let failedLoads = 0;
//   const timeoutMs = 10000; // 10 seconds timeout

//   let totalCost = 0;
//   const maxCost = 10; // Maximum cost in USD

//   // Estimate the cost of embeddings
//   const tokenCost = 0.0001; // Example cost per token


//   for (let map of filteredSiteMap) {
//     const pagesContent = await loadUrlWithTimeout(map.loc, timeoutMs);
//     if (pagesContent) {
//       pagesContent.forEach((content: { pageContent: { length: any; split: (arg0: string) => { (): any; new(): any; length: any; }; }; url: any; }) => {
//         const contentSize = content.pageContent.length;
//         const contentTokens = content.pageContent.split(" ").length;
//         const contentCost = contentTokens * tokenCost;

//         if (totalCost + contentCost <= maxCost) {
//           totalSize += contentSize;
//           totalCost += contentCost;

//           final.push({
//             text: content.pageContent,
//             metadata: { source: content.url }
//           });
//         } else {
//           console.log(`Maximum cost reached. Skipping URL: ${content.url}`);
//         }
//       });
//     } else {
//       failedLoads++;
//     }

//     if (totalCost >= maxCost) {
//       console.log("Maximum cost reached. Stopping further loading.");
//       break;
//     }else{
//       successfulLoads++;
//     }
//   }

//   if (final.length === 0) {
//     console.error("No pages were successfully loaded.");
//     return;
//   }

//   const texts = final.map(item => item.text);
//   const ids = final.map((_,index) => {
//     return {id: index};
//   });
//   const pageMetaData = final.map(item => item.metadata);
//   // console.log(metadata);

//   const totalTokens = texts.reduce((acc, text) => acc + text.split(" ").length, 0);

//   const estimatedCost = totalTokens * tokenCost;
//   console.log("Estimated cost for embeddings:", estimatedCost.toFixed(2), "USD");
//   console.log("Total size of documents:", totalSize, "characters");
//   console.log("Total documents loaded successfully:", successfulLoads);
//   console.log("Total documents failed to load:", failedLoads);

//   // Check with the user if they want to proceed
//   const userResponse:string = await promptUser("Do you want to proceed with creating the vector store? (yes/no): ") as string;
//   if (userResponse.toLowerCase() !== "yes") {
//     console.log("Aborting the creation of the vector store.");
//     return;
//   }

//   try {
//     console.log("Creating vector store...");
//     console.log(ids);

//     const chromaArgs = {
//       collectionName: "grammar-collection-3",
//     };
//     // const vectorStore = new QdrantVectorStore(embeddings, chromaArgs);
//   // const existingDocuments = await vectorStore.getDocuments();

//     const vectorStore = await QdrantVectorStore.fromTexts(texts, ids, embeddings, {
//         url: "http://localhost:6333",
//         collectionName: "goldel_escher_bach",      
//     });

    
//     console.log("Vector store created successfully");

//     console.log("Performing similarity search...");
//     const question = "How to write a grammatically correct email?";
//     const response = await vectorStore.similaritySearch(question, 1);
//     if (response.length > 0) {
//       const context = response[0].pageContent;
//       console.log("Context retrieved from vector store, now optimizing the document.")
//       const optimizedContext = await optimizeContent(context);
//       console.log("Context is optimized.");

//       console.log("Generating answer...");
//       const answer = await askQuestion(question, optimizedContext, pageMetaData);
//       console.log("Answer:", answer);
//     } else {
//       console.log("No relevant information found.");
//     }
//   } catch (error) {
//     console.error("Failed to create vector store or perform similarity search:", error);
//   }
// }

// main().catch(console.error);
