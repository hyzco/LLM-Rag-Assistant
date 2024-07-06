// app.ts or index.ts (main entry point)
import Chat from "./chat.RAG.js";
import initializeApplication from "./config/Initializers.js";
import logger from "./utils/Logger.js";

class App extends Chat {
  constructor() {
    try {
      (async () => {
        logger.log("App is initializing.");
        // Initialize application first to load environment variables
        await new Promise((resolve) => resolve(initializeApplication()));

        await super.build();
        let i = 0;
        while (i < 10) {
          await super.processUserInput(this.webSocketModule.transcribedChunk);
          i++;
        }
        logger.warn("APP is terminated.");
        this.webSocketModule.closeWebSocket();

        process.exit(0);
      })();
    } catch (error) {
      logger.error("An error occured: ", error);
    }

    super();
  }
}

new App();
