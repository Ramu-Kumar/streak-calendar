"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUserById = findUserById;
exports.findUserByGoogleId = findUserByGoogleId;
exports.upsertGoogleUser = upsertGoogleUser;
exports.getTasksForUser = getTasksForUser;
exports.createTaskForUser = createTaskForUser;
exports.updateTaskIntensityLevels = updateTaskIntensityLevels;
exports.recordActivity = recordActivity;
exports.getActivityForTask = getActivityForTask;
exports.getActivityForUser = getActivityForUser;
const crypto_1 = require("crypto");
const mongoClient_1 = require("./mongoClient");
const DEFAULT_INTENSITY_LEVELS = [
    { label: "light", minCount: 1, color: "#D6E685" },
    { label: "medium", minCount: 3, color: "#8CC665" },
    { label: "heavy", minCount: 5, color: "#44A340" },
];
async function findUserById(userId) {
    const db = await (0, mongoClient_1.getDb)();
    const user = await db.collection("users").findOne({ id: userId });
    return user ?? undefined;
}
async function findUserByGoogleId(googleId) {
    const db = await (0, mongoClient_1.getDb)();
    const user = await db.collection("users").findOne({ googleId });
    return user ?? undefined;
}
async function upsertGoogleUser(params) {
    const now = new Date().toISOString();
    const db = await (0, mongoClient_1.getDb)();
    const users = db.collection("users");
    const existing = await users.findOne({ googleId: params.googleId });
    if (existing) {
        await users.updateOne({ id: existing.id }, {
            $set: {
                name: params.name,
                email: params.email,
                avatarUrl: params.avatarUrl,
                updatedAt: now,
            },
        });
        return {
            ...existing,
            name: params.name,
            email: params.email,
            avatarUrl: params.avatarUrl,
            updatedAt: now,
        };
    }
    const user = {
        id: (0, crypto_1.randomUUID)(),
        googleId: params.googleId,
        name: params.name,
        email: params.email,
        avatarUrl: params.avatarUrl,
        createdAt: now,
        updatedAt: now,
    };
    await users.insertOne(user);
    return user;
}
async function getTasksForUser(userId) {
    const db = await (0, mongoClient_1.getDb)();
    return db.collection("tasks").find({ userId }).toArray();
}
async function createTaskForUser(params) {
    const now = new Date().toISOString();
    const task = {
        id: (0, crypto_1.randomUUID)(),
        userId: params.userId,
        name: params.name,
        description: params.description,
        createdAt: now,
        intensityLevels: params.intensityLevels ?? DEFAULT_INTENSITY_LEVELS,
    };
    const db = await (0, mongoClient_1.getDb)();
    await db.collection("tasks").insertOne(task);
    return task;
}
async function updateTaskIntensityLevels(params) {
    const db = await (0, mongoClient_1.getDb)();
    const tasks = db.collection("tasks");
    const updatedTask = await tasks.findOneAndUpdate({ id: params.taskId, userId: params.userId }, {
        $set: {
            intensityLevels: params.intensityLevels,
        },
    }, {
        returnDocument: "after",
    });
    if (!updatedTask) {
        throw new Error("Task not found or access denied");
    }
    return updatedTask;
}
async function recordActivity(params) {
    const now = new Date().toISOString();
    const db = await (0, mongoClient_1.getDb)();
    const activityCollection = db.collection("activity");
    const filter = {
        userId: params.userId,
        taskId: params.taskId,
        date: params.date,
    };
    const updatedActivity = await activityCollection.findOneAndUpdate(filter, {
        $setOnInsert: {
            id: (0, crypto_1.randomUUID)(),
            userId: params.userId,
            taskId: params.taskId,
            date: params.date,
            createdAt: now,
        },
        $set: {
            updatedAt: now,
            ...(params.metadata ? { metadata: params.metadata } : {}),
        },
        $inc: {
            count: params.count,
        },
    }, {
        upsert: true,
        returnDocument: "after",
    });
    if (!updatedActivity) {
        const inserted = await activityCollection.findOne(filter);
        if (!inserted) {
            throw new Error("Failed to record activity");
        }
        return inserted;
    }
    return updatedActivity;
}
async function getActivityForTask(taskId) {
    const db = await (0, mongoClient_1.getDb)();
    return db.collection("activity").find({ taskId }).toArray();
}
async function getActivityForUser(userId) {
    const db = await (0, mongoClient_1.getDb)();
    return db.collection("activity").find({ userId }).toArray();
}
//# sourceMappingURL=repository.js.map