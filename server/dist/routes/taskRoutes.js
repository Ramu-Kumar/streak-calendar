"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskRouter = void 0;
const express_1 = require("express");
const passport_1 = require("../auth/passport");
const repository_1 = require("../storage/repository");
const heatmap_1 = require("../services/heatmap");
exports.taskRouter = (0, express_1.Router)();
exports.taskRouter.use(passport_1.requireAuth);
exports.taskRouter.get("/", async (req, res, next) => {
    try {
        const user = req.user;
        const includeHeatmap = req.query.includeHeatmap === "true";
        const tasks = await (0, repository_1.getTasksForUser)(user.id);
        if (!includeHeatmap) {
            res.json({ tasks });
            return;
        }
        const tasksWithHeatmap = [];
        for (const task of tasks) {
            const records = await (0, repository_1.getActivityForTask)(task.id);
            tasksWithHeatmap.push({
                task,
                heatmap: (0, heatmap_1.buildHeatmap)(task, records),
            });
        }
        res.json({ tasks: tasksWithHeatmap });
    }
    catch (error) {
        next(error);
    }
});
exports.taskRouter.post("/", async (req, res, next) => {
    try {
        const user = req.user;
        const { name, description, intensityLevels } = req.body;
        if (!name) {
            res.status(400).json({ message: "Task name is required" });
            return;
        }
        const task = await (0, repository_1.createTaskForUser)({
            userId: user.id,
            name,
            description,
            intensityLevels,
        });
        res.status(201).json({ task });
    }
    catch (error) {
        next(error);
    }
});
exports.taskRouter.put("/:taskId/intensity", async (req, res, next) => {
    try {
        const user = req.user;
        const { taskId } = req.params;
        const { intensityLevels } = req.body;
        if (!Array.isArray(intensityLevels) || intensityLevels.length === 0) {
            res.status(400).json({ message: "Intensity levels must be provided" });
            return;
        }
        const updatedTask = await (0, repository_1.updateTaskIntensityLevels)({
            taskId,
            userId: user.id,
            intensityLevels,
        });
        res.json({ task: updatedTask });
    }
    catch (error) {
        next(error);
    }
});
//# sourceMappingURL=taskRoutes.js.map