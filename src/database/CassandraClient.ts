import { Client } from "cassandra-driver";
import path from "path";

export class CassandraClient {
  private static _keySpace: string;
  private static _secureConnectBundle: string;
  public static client: Client;

  public static initialize() {
    if (!this._keySpace || !this._secureConnectBundle) {
      throw new Error(
        "First set keySpace and path to your secureConnectBundle."
      );
    }

    this.client = new Client({
      cloud: {
        secureConnectBundle: path.resolve(this._secureConnectBundle),
      },
      credentials: {
        username: process.env.ASTRA_DB_UNAME,
        password: process.env.ASTRA_DB_PW,
      },
    });
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
