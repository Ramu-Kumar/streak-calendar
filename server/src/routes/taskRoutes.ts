import { Router } from "express";
import { requireAuth } from "../auth/passport";
import {
  createTaskForUser,
  getActivityForTask,
  getTasksForUser,
  updateTaskIntensityLevels,
} from "../storage/repository";
import { buildHeatmap } from "../services/heatmap";
import { IntensityLevel, TaskWithHeatmap } from "../types";

export const taskRouter = Router();

taskRouter.use(requireAuth);

taskRouter.get("/", async (req, res, next) => {
  try {
    const user = req.user!;
    const includeHeatmap = req.query.includeHeatmap === "true";
    const tasks = await getTasksForUser(user.id);

    if (!includeHeatmap) {
      res.json({ tasks });
      return;
    }

    const tasksWithHeatmap: TaskWithHeatmap[] = [];
    for (const task of tasks) {
      const records = await getActivityForTask(task.id);
      tasksWithHeatmap.push({
        task,
        heatmap: buildHeatmap(task, records),
      });
    }

    res.json({ tasks: tasksWithHeatmap });
  } catch (error) {
    next(error);
  }
});

taskRouter.post("/", async (req, res, next) => {
  try {
    const user = req.user!;
    const { name, description, intensityLevels } = req.body as {
      name: string;
      description?: string;
      intensityLevels?: IntensityLevel[];
    };

    if (!name) {
      res.status(400).json({ message: "Task name is required" });
      return;
    }

    const task = await createTaskForUser({
      userId: user.id,
      name,
      description,
      intensityLevels,
    });

    res.status(201).json({ task });
  } catch (error) {
    next(error);
  }
});

taskRouter.put("/:taskId/intensity", async (req, res, next) => {
  try {
    const user = req.user!;
    const { taskId } = req.params;
    const { intensityLevels } = req.body as {
      intensityLevels: IntensityLevel[];
    };

    if (!Array.isArray(intensityLevels) || intensityLevels.length === 0) {
      res.status(400).json({ message: "Intensity levels must be provided" });
      return;
    }

    const updatedTask = await updateTaskIntensityLevels({
      taskId,
      userId: user.id,
      intensityLevels,
    });

    res.json({ task: updatedTask });
  } catch (error) {
    next(error);
  }
});

