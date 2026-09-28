import "server-only";
import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGO_URL as string;
const dbName = process.env.DB_NAME as string;

const g = globalThis as unknown as {
  __gmitMongo?: Promise<MongoClient>;
};

function clientPromise(): Promise<MongoClient> {
  if (!g.__gmitMongo) {
    g.__gmitMongo = new MongoClient(uri).connect();
  }
  return g.__gmitMongo;
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise();
  return client.db(dbName);
}
