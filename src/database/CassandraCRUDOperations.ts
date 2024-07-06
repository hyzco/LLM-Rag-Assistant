import { CassandraClient } from "./CassandraClient";

export class CassandraCRUDOperations {
  static async createTable(tableName: string, columns: string) {
    const query = `CREATE TABLE IF NOT EXISTS ${tableName} (${columns});`;
    await CassandraClient.client.execute(query);
  }

  static async insertRecord(tableName: string, values: any[]) {
    const query = `INSERT INTO ${tableName} (id, title) VALUES (?, ?);`;
    await CassandraClient.client.execute(query, values);
  }

  static async selectRecord(tableName: string, id: number) {
    const query = `SELECT * FROM ${tableName} WHERE id = ?;`;
    const result = await CassandraClient.client.execute(query, [id]);
    return result.rows;
  }

  static async updateRecord(tableName: string, id: number, newValues: any[]) {
    const setClauses = newValues
      .map((value, index) => `column${index + 1} = ?`)
      .join(", ");
    const query = `UPDATE ${tableName} SET ${setClauses} WHERE id = ?;`;
    await CassandraClient.client.execute(query, [...newValues, id]);
  }

  static async deleteRecord(tableName: string, id: number) {
    const query = `DELETE FROM ${tableName} WHERE id = ?;`;
    await CassandraClient.client.execute(query, [id]);
  }
}
