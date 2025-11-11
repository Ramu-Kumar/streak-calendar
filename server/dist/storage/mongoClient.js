"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = getDb;
exports.disconnect = disconnect;
const mongodb_1 = require("mongodb");
const config_1 = require("../config");
const globalForMongo = globalThis;
async function createClient() {
    if (!config_1.config.mongo.uri) {
        throw new Error("MONGODB_URI environment variable is required");
    }
    const client = new mongodb_1.MongoClient(config_1.config.mongo.uri, {
        serverSelectionTimeoutMS: 5000,
    });
    await client.connect();
    return client;
}
async function getDb() {
    if (globalForMongo._mongoDb) {
        return globalForMongo._mongoDb;
    }
    const client = globalForMongo._mongoClient ?? (await createClient());
    const db = client.db(config_1.config.mongo.dbName);
    globalForMongo._mongoClient = client;
    globalForMongo._mongoDb = db;
    return db;
}
async function disconnect() {
    if (globalForMongo._mongoClient) {
        await globalForMongo._mongoClient.close();
        globalForMongo._mongoClient = undefined;
        globalForMongo._mongoDb = undefined;
    }
}
//# sourceMappingURL=mongoClient.js.map