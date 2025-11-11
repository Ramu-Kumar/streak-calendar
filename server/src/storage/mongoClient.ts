import { MongoClient, Db } from "mongodb";
import { config } from "../config";

const globalForMongo = globalThis as unknown as {
  _mongoClient?: MongoClient;
  _mongoDb?: Db;
};

async function createClient(): Promise<MongoClient> {
  if (!config.mongo.uri) {
    throw new Error("MONGODB_URI environment variable is required");
  }

  const client = new MongoClient(config.mongo.uri, {
    serverSelectionTimeoutMS: 5000,
  });

  await client.connect();
  return client;
}

export async function getDb(): Promise<Db> {
  if (globalForMongo._mongoDb) {
    return globalForMongo._mongoDb;
  }

  const client = globalForMongo._mongoClient ?? (await createClient());
  const db = client.db(config.mongo.dbName);

  globalForMongo._mongoClient = client;
  globalForMongo._mongoDb = db;

  return db;
}

export async function disconnect(): Promise<void> {
  if (globalForMongo._mongoClient) {
    await globalForMongo._mongoClient.close();
    globalForMongo._mongoClient = undefined;
    globalForMongo._mongoDb = undefined;
  }
}

