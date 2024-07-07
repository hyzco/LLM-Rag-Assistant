import { Client } from "cassandra-driver";
import logger from "../utils/Logger";

export class CassandraCRUDOperations {
  private client: Client;
  constructor(client: Client) {
    this.client = client;
  }

  async createTable(tableName: string, columns: string) {
    const query = `CREATE TABLE IF NOT EXISTS ${tableName} (${columns});`;
    await this.client.execute(query);
  }

  async insertRecord(tableName: string, values: any[]) {
    const query = `INSERT INTO ${tableName} (id, title) VALUES (?, ?);`;
    await this.client.execute(query, values);
  }

  async selectRecord(tableName: string, id: number) {
    try {
      const query = `SELECT * FROM eva_chat.${tableName} WHERE id = ?;`;
      const result = await this.client.execute(query, [id], { prepare: true });
      return result.rows;
    } catch (error) {
      logger.error("Cassandra CRUD, select error: ", error);
    }
  }

  async updateRecord(tableName: string, id: number, newValues: any[]) {
    const setClauses = newValues
      .map((value, index) => `column${index + 1} = ?`)
      .join(", ");
    const query = `UPDATE ${tableName} SET ${setClauses} WHERE id = ?;`;
    await this.client.execute(query, [...newValues, id]);
  }

  async deleteRecord(tableName: string, id: number) {
    const query = `DELETE FROM ${tableName} WHERE id = ?;`;
    await this.client.execute(query, [id]);
  }
}
