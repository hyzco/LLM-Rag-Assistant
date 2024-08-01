import cassandra, { Client } from "cassandra-driver";
import path from "path";

export class CassandraClient {
  private static _keySpace: string;
  private static _secureConnectBundle: string;
  public static client: Client;

  public static initialize(): Client {
    if (!this._keySpace || !this._secureConnectBundle) {
      throw new Error(
        "First set keySpace and path to your secureConnectBundle."
      );
    }

    try {
      const authProvider = new cassandra.auth.PlainTextAuthProvider(
        "token",
        process.env["CASSANDRA_TOKEN"]
      );

      this.client = new Client({
        cloud: {
          secureConnectBundle: path.resolve(this._secureConnectBundle),
        },
        authProvider,
      });

      return this.client;
    } catch (error) {
      throw new Error("Error while initializing Cassandra client: " + error);
    }
  }

  public static set keySpace(keySpace: string) {
    this._keySpace = keySpace;
  }

  public static set secureConnectBundle(bundlePath: string) {
    this._secureConnectBundle = bundlePath;
  }

  public static get keySpace() {
    return this._keySpace;
  }
}
