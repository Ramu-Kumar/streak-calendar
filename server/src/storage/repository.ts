import { randomUUID } from "crypto";
import { Filter } from "mongodb";
import {
  ActivityRecord,
  IntensityLevel,
  Task,
  User,
} from "../types";
import { getDb } from "./mongoClient";

const DEFAULT_INTENSITY_LEVELS: IntensityLevel[] = [
  { label: "light", minCount: 1, color: "#D6E685" },
  { label: "medium", minCount: 3, color: "#8CC665" },
  { label: "heavy", minCount: 5, color: "#44A340" },
];

export async function findUserById(userId: string): Promise<User | undefined> {
  const db = await getDb();
  const user = await db.collection<User>("users").findOne({ id: userId });
  return user ?? undefined;
}

export async function findUserByGoogleId(
  googleId: string
): Promise<User | undefined> {
  const db = await getDb();
  const user = await db.collection<User>("users").findOne({ googleId });
  return user ?? undefined;
}

export async function upsertGoogleUser(params: {
  googleId: string;
  name: string;
  email: string;
  avatarUrl?: string;
}): Promise<User> {
  const now = new Date().toISOString();
  const db = await getDb();
  const users = db.collection<User>("users");

  const existing = await users.findOne({ googleId: params.googleId });
  if (existing) {
    await users.updateOne(
      { id: existing.id },
      {
        $set: {
          name: params.name,
          email: params.email,
          avatarUrl: params.avatarUrl,
          updatedAt: now,
        },
      }
    );
    return {
      ...existing,
      name: params.name,
      email: params.email,
      avatarUrl: params.avatarUrl,
      updatedAt: now,
    };
  }

  const user: User = {
    id: randomUUID(),
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

export async function getTasksForUser(userId: string): Promise<Task[]> {
  const db = await getDb();
  return db.collection<Task>("tasks").find({ userId }).toArray();
}

export async function createTaskForUser(params: {
  userId: string;
  name: string;
  description?: string;
  intensityLevels?: IntensityLevel[];
}): Promise<Task> {
  const now = new Date().toISOString();
  const task: Task = {
    id: randomUUID(),
    userId: params.userId,
    name: params.name,
    description: params.description,
    createdAt: now,
    intensityLevels: params.intensityLevels ?? DEFAULT_INTENSITY_LEVELS,
  };

  const db = await getDb();
  await db.collection<Task>("tasks").insertOne(task);

  return task;
}

export async function updateTaskIntensityLevels(params: {
  taskId: string;
  userId: string;
  intensityLevels: IntensityLevel[];
}): Promise<Task> {
  const db = await getDb();
  const tasks = db.collection<Task>("tasks");
  const updatedTask = await tasks.findOneAndUpdate(
    { id: params.taskId, userId: params.userId },
    {
      $set: {
        intensityLevels: params.intensityLevels,
      },
    },
    {
      returnDocument: "after",
    }
  );

  if (!updatedTask) {
    throw new Error("Task not found or access denied");
  }

  return updatedTask;
}

export async function recordActivity(params: {
  userId: string;
  taskId: string;
  date: string;
  count: number;
  metadata?: Record<string, unknown>;
}): Promise<ActivityRecord> {
  const now = new Date().toISOString();
  const db = await getDb();
  const activityCollection = db.collection<ActivityRecord>("activity");

  const filter: Filter<ActivityRecord> = {
    userId: params.userId,
    taskId: params.taskId,
    date: params.date,
  };

  const updatedActivity = await activityCollection.findOneAndUpdate(
    filter,
    {
      $setOnInsert: {
        id: randomUUID(),
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
    },
    {
      upsert: true,
      returnDocument: "after",
    }
  );

  if (!updatedActivity) {
    const inserted = await activityCollection.findOne(filter);
    if (!inserted) {
      throw new Error("Failed to record activity");
    }
    return inserted;
  }

  return updatedActivity;
}

export async function getActivityForTask(taskId: string): Promise<ActivityRecord[]> {
  const db = await getDb();
  return db.collection<ActivityRecord>("activity").find({ taskId }).toArray();
}

export async function getActivityForUser(userId: string): Promise<ActivityRecord[]> {
  const db = await getDb();
  return db.collection<ActivityRecord>("activity").find({ userId }).toArray();
}

