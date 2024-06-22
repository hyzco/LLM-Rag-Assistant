import { CassandraStore } from "@langchain/community/vectorstores/cassandra";
import CassandraVectorDatabase from "../database/CassandraVectorDatabase.js";

export default interface AiPlugin{
    name: String;
    description: String;
    vectorProvider: CassandraVectorDatabase;
    vectorStore: CassandraStore;
}
