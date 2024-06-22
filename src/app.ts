// app.ts or index.ts (main entry point)
import initializeApplication from "./config/Initializers.js";
// Initialize application first to load environment variables
initializeApplication();

import Chat from "./chat.RAG.js";
// Create an instance of Chat and run the application
new Chat().buildApp();
