const configConnection = {
  serviceProviderArgs: {
    astra: {
      endpoint:
        "https://f0e8af84-72b8-4b69-a6ab-4cb29ae27b93-us-east-2.apps.astra.datastax.com",
      clientId: "bUqSjZKYmtWXyuCdXoECoZSw",
      secret:
        "OmESvqJTja3se3UwpjBtAnMEoxRO1fEg4o,yUICh5fjl-N7E4EyF.MwoRn0CDAq_vT+jmY+ycJmHn1AEg,BRiJrAL9liXrqyw42,e5Pjnn6qqmj8uq3SI0lQ2lEOYlGf",
      token:
        "AstraCS:bUqSjZKYmtWXyuCdXoECoZSw:ce1669c06ed7bf4d67d61da1732959a78017e9ab1ef6786692ecfc939565d743",
    },
  },
};

const cassandraConfig = {
  ...configConnection,
  keyspace: "eva_chat",
  dimensions: 4096,
  table: "test6",
  indices: [
    { name: "title", value: "(title)" },
  ],
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
