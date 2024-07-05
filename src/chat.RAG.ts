import {
  AIMessage,
  BaseMessageChunk,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import inquirer, { PromptModule } from "inquirer";
import WebSocket, { WebSocketServer } from "ws";
import { ITool } from "./AiTools.js";
import RAG from "./RAG.js";
import NoteManagementPlugin, { INote } from "./plugins/NoteManagement.plugin.js";
import Api, { ApiMethods } from "./utils/Api.js";
import { IterableReadableStream } from "@langchain/core/utils/stream";

interface TranscribedData {
  chunks: any[]; // Adjust as per your actual data structure
}

interface WebSocketMessage {
  type: string;
  data: any;
}

interface Client {
  id: string;
  ws: WebSocket;
}

interface Context {
  lastToolUsed: string | null;
  lastToolData: any;
}

export default class Chat extends RAG {
  protected inquirer: PromptModule;
  private socket: WebSocketServer | null = null;
  private clients: Client[] = [];
  private context: Context = { lastToolUsed: null, lastToolData: null };

  constructor() {
    super();
    this.inquirer = inquirer.createPromptModule();
    this.initializeWebSocket(8080);
  }

  // Initialize WebSocket connection
  private initializeWebSocket(port: number) {
    this.socket = new WebSocketServer({ port });

    this.socket.on("connection", (ws: WebSocket) => {
      console.log("Client connected");

      // Handle new client connection
      const clientId = Math.random().toString(36).substring(7); // Generate unique client ID
      this.clients.push({ id: clientId, ws });

      ws.on("message", (message: WebSocket.Data) => {
        try {
          const data: WebSocketMessage = JSON.parse(message.toString());
          this.handleWebSocketMessage(data, ws);
        } catch (error) {
          console.error("Error parsing incoming message:", error);
        }
      });

      ws.on("error", (err) => {
        console.log("Error: ", err);
      });

      ws.on("close", () => {
        console.log("Client disconnected");
        this.clients = this.clients.filter((client) => client.ws !== ws); // Remove disconnected client
      });
    });
  }

  // Method to handle incoming WebSocket messages
  private handleWebSocketMessage(message: WebSocketMessage, ws: WebSocket) {
    switch (message.type) {
      case "TRANSCRIBED_DATA":
        this.handleTranscribedData(message.data);
        break;
      case "TRANSCRIBED_CHUNK":
        this.handleTranscribedChunk(message.data);
        break;
      default:
        console.log("Unknown message type:", message.type);
    }
  }

  // Example function to handle full transcribed data
  private handleTranscribedData(data: TranscribedData) {
    console.log("Received full transcribed data:", data);
    // Process full transcribed data as needed
  }

  // Example function to handle transcribed chunk
  private async handleTranscribedChunk(chunk: any) {
    try {
      console.log("Received transcribed chunk:", chunk);
      await this.processUserInput(chunk.text.trim());
    } catch (error) {
      console.error("Error handling transcribed chunk:", error);
    }
  }

  // Method to send message to WebSocket clients
  private sendMessageToClients(message: any) {
    if (this.socket) {
      this.socket.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(message));
        }
      });
    }
  }

  // Method to build and run the chat application
  public buildApp() {
    return (async () => {
      await this.build();
      let i = 0;
      while (i < 10) {
        await this.processUserInput();
        i++;
      }
      console.log("APP is terminated.");
      if (this.socket) {
        this.socket.close();
      }
      process.exit(0);
    })();
  }

  // Process user input with context tracking
  public async processUserInput(socketInput: string | null = null) {
    try {
      const userInput = socketInput != null ? socketInput : await this.getUserInput();
      const toolName: string = await this.determineTool(userInput);

      if (toolName) {
        console.log(`Determined tool: ${toolName}`);
        const response = await this.getResponse(toolName, userInput);
        if (response) {
          this.conversationHistory.push(new AIMessage(response));
          this.sendMessageToClients(response);
        } else {
          console.log("No appropriate tool found for the given input.");
        }
      }
    } catch (error) {
      console.error("Error processing user input:", error);
    }
  }

  // Determine the appropriate tool and get the response
  private async getResponse(toolName: string, userInput: string): Promise<string | void> {
    let response: string | IterableReadableStream<String | BaseMessageChunk>;

    if (this.isFollowUpQuestion(userInput)) {
      response = await this.handleFollowUpQuestion(userInput);
    } else {
      switch (toolName) {
        case "weather_tool":
          response = await this.handleWeatherTool(userInput);
          break;
        case "calendar_tool":
          console.log("Tool has no method definition.");
          break;
        case "note_tool":
          response = await this.handleNoteTool(userInput);
          break;
        case "course_tool":
          response = await this.handleCourseTool(userInput);
          break;
        default:
          response = await this.handleDefaultTool(userInput);
          break;
      }
      this.context.lastToolUsed = toolName;
      this.context.lastToolData = response;
    }
    
    return await this.convertResponseToString(response);
  }

  // Convert response to string if it is iterable
  private async convertResponseToString(
    response: string | IterableReadableStream<String | BaseMessageChunk>
  ) {
    if (typeof response === "string") {
      return response;
    } else {
      let responseString = "";
      for await (const chunk of response) {
        const chunkContent = typeof chunk === "string" ? chunk : (chunk as BaseMessageChunk).content;
        responseString += chunkContent;
        process.stdout.write(chunkContent.toString()); // Use process.stdout.write to avoid new lines
      }
      console.log(); // Add a final new line after all chunks have been processed
      return responseString;
    }
  }

  // Improved tool determination
  async determineTool(userInput: string): Promise<string> {
    const tool = await super.determineTool(userInput);
    return tool;
  }

  // Check if the question is a follow-up question
  private isFollowUpQuestion(userInput: string): boolean {
    if (this.context.lastToolUsed && this.context.lastToolData) {
      if (this.context.lastToolUsed === "weather_tool") {
        const weatherKeywords = [
          "compare",
          "warmer",
          "colder",
          "rainy",
          "rain",
          "temperature",
          "condition",
          "forecast",
          "storm",
          "wind",
          "humidity",
          "sunny",
          "cloudy",
          "snow",
          "thunderstorm",
        ];
        const pattern = new RegExp(weatherKeywords.join("|"), "i");
        return pattern.test(userInput);
      }
    }

    return false;
  }

  // Handle follow-up questions based on previous data
  private async handleFollowUpQuestion(userInput: string) {
    if (this.context.lastToolUsed === "weather_tool" && this.context.lastToolData) {
      const data = this.context.lastToolData;
      const prompt = `Handle the follow-up question after tool usage based on user input and tool data. User input: ${userInput} Previous tool data: ${data}. Respond short, precise.`;
      const response = this.handleDefaultTool(prompt);
      return response;
    }

    return new ReadableStream({
      start(controller) {
        controller.enqueue(
          "I'm not sure how to answer that based on the previous data."
        );
        controller.close();
      },
    }) as IterableReadableStream<String>;
  }

  // Handle tool input (common method for weather_tool and note_tool)
  private async handleToolInput(
    userInput: string,
    toolName: string,
    actionHandler: (
      userInput: string,
      toolJson: ITool
    ) => Promise<IterableReadableStream<String>> | Promise<string>
  ) {
    this.conversationHistory.push(new HumanMessage(userInput));

    const toolJson: ITool = await this.buildTool(
      userInput,
      this.aiTools.getTool(toolName)
    );

    const response = await actionHandler(userInput, toolJson);

    return response;
  }

  // Handle weather tool input
  private handleCourseTool(userInput: string) {
    const actionHandler = (userInput: string) => {
      const evaluatedStream = this.jsonEvaluator(userInput);
      return evaluatedStream;
    };

    return this.handleToolInput(userInput, "course_tool", actionHandler);
  }

  // Handle weather tool input
  private async handleWeatherTool(userInput: string) {
    const actionHandler = async (userInput: string, toolJson: ITool) => {
      const weatherAPI = new Api("Weather API", async () => {
        const weatherData = await ApiMethods.fetchWeatherData(
          toolJson.toolArgs.location
        );
        return weatherData;
      });
      const apiResponse = await weatherAPI.execute();
      const evaluatedStream = this.jsonEvaluator(
        JSON.stringify(apiResponse),
        userInput
      );
      return evaluatedStream;
    };

    return this.handleToolInput(userInput, "weather_tool", actionHandler);
  }

  // Handle note tool input
  private async handleNoteTool(userInput: string) {
    const actionHandler = async (userInput: string, toolJson: ITool) => {
      const noteManagement: NoteManagementPlugin = this.noteManagementPlugin;

      const actionType = toolJson.toolArgs.action_type.toLowerCase();
      const note: INote = {
        title: toolJson.toolArgs.title,
        content: toolJson.toolArgs.content,
      };

      if (
        actionType === "save" &&
        typeof note.title === "string" &&
        typeof note.content === "string"
      ) {
        const isStored = await noteManagement.storeNote(note);
        if (isStored) {
          console.log("New note is added. Note=", toolJson);
        } else {
          console.warn("New note could not be added.");
        }
      } else if (actionType === "get") {
        const optimizedInput = await this.queryOptimizer(userInput);
        const results = await noteManagement.queryNotes(optimizedInput);
        const pageContent = results.map((doc) => doc.pageContent).join("");
        return pageContent;
      }
    };

    return this.handleToolInput(userInput, "note_tool", actionHandler);
  }

  // Handle default tool (chat)
  private handleDefaultTool(userInput: string) {
    const prompt = `You are a virtual assistant and have few available tools your boss to use. Tools: ${this.aiTools.listTools()}`;
    this.conversationHistory.push(new HumanMessage(userInput));

    const stream = this.chatModel.stream([
      new SystemMessage(prompt),
      ...this.conversationHistory,
    ]);

    return stream;
  }

  // Get user input method
  private async getUserInput(): Promise<string> {
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "userInput",
        message: "Enter your input:",
      },
    ]);
    return answers.userInput;
  }
}
