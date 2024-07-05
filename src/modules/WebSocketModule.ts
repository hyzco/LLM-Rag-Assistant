// WebSocketModule.ts
import WebSocket, { WebSocketServer } from "ws";
import logger from "../utils/Logger";

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

export default class WebSocketModule {
  private socket: WebSocketServer | null = null;
  private clients: Client[] = [];
  transcribedChunk: any;

  constructor(private port: number) {
    this.port = port;
  }

  public initializeWebSocket() {
    this.socket = new WebSocketServer({ port: this.port });

    this.socket.on("connection", (ws: WebSocket) => {
      logger.log("WebSocket client connected.");

      const clientId = Math.random().toString(36).substring(7);
      this.clients.push({ id: clientId, ws });

      ws.on("message", (message: WebSocket.Data) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleWebSocketMessage(data, ws);
        } catch (error) {
          logger.error("WebSocket error parsing incoming message:", error);
        }
      });

      ws.on("error", (err) => {
        logger.log("Error: ", err);
      });

      ws.on("close", () => {
        logger.log("Client disconnected");
        this.clients = this.clients.filter((client) => client.ws !== ws);
      });
    });
  }

  public sendMessageToClients(message: any) {
    if (this.socket) {
      this.socket.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(message));
        }
      });
    }
  }

  public closeWebSocket() {
    if (this.socket) {
      this.socket.close();
    }
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
        logger.log("Unknown message type:", message.type);
    }
  }

  // Example function to handle full transcribed data
  private handleTranscribedData(data: TranscribedData) {
    throw new Error("Method is not implemented.");
    // Process full transcribed data as needed
  }

  // Example function to handle transcribed chunk
  private async handleTranscribedChunk(chunk: any) {
    try {
      logger.log("Received transcribed chunk:", chunk);
      this.transcribedChunk = chunk.text.trim();

      //   await this.processUserInput(chunk.text.trim());
    } catch (error) {
      logger.error("Error handling transcribed chunk:", error);
    }
  }
}
