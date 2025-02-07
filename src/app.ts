// app.ts or index.ts (main entry point)
import Chat from "./chat/chat.RAG";
import initializeApplication from "./config/Initializers";
import ContentCreator from "./content_ai/content.RAG";
import logger from "./utils/Logger";

// class App extends Chat {
//   constructor() {
//     super();
//   }

//   async start() {
//     logger.log("App is initializing.");
//     // Initialize application first to load environment variables
//     await Promise.resolve(initializeApplication());

//     await super.build();
//     let i = 0;
//     while (i < 10) {
//       await super.processUserInput(this.webSocketModule.transcribedChunk);
//       i++;
//     }
//     logger.warn("APP is terminated.");
//     this.webSocketModule.closeWebSocket();

//     process.exit(0);
//   }
// }

// try {
//   const myAiApp = new App();
//   myAiApp.start();
// } catch (e) {
//   console.log("Error while initializing the app: ", e);
// }

class App extends ContentCreator {
  constructor() {
    super();
  }

  async start() {
    logger.log("App is initializing.");
    // Initialize application first to load environment variables
    await Promise.resolve(initializeApplication());

    await super.build();
    let i = 0;
    while (i < 10) {
      const input = await super.getUserInput();
      const ideas = await super.produceContentIdeas(input);
      this.webSocketModule.sendIterableReadableStream(ideas);
      i++;
    }
    logger.warn("APP is terminated.");

    process.exit(0);
  }
}

new App().start();
