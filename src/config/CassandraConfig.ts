const configConnection = {
  serviceProviderArgs: {
    astra: {
      endpoint: process.env.CASSANDRA_HOST,
      clientId: process.env.CASSANDRA_CLIENT_ID,
      secret: process.env.CASSANDRA_SECRET,
      token: process.env.CASSANDRA_TOKEN,
    },
  },
};

const cassandraConfig = {
  ...configConnection,
  keyspace: "eva_chat",
  dimensions: 4096,
  table: "test6",
  indices: [{ name: "title", value: "(title)" }],
  primaryKey: {
    name: "id",
    type: "int",
  },
  metadataColumns: [
    {
      name: "title",
      type: "text",
    },
  ],
  maxConcurrency: 25,
  // batchSize: 1,
};

export default cassandraConfig;
