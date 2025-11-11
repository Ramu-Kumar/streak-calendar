"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activityRouter = void 0;
const express_1 = require("express");
const passport_1 = require("../auth/passport");
const repository_1 = require("../storage/repository");
const heatmap_1 = require("../services/heatmap");
exports.activityRouter = (0, express_1.Router)();
exports.activityRouter.use(passport_1.requireAuth);
exports.activityRouter.post("/", async (req, res, next) => {
    try {
        const user = req.user;
        const { taskId, date, count, metadata } = req.body;
        if (!taskId || !date || typeof count !== "number") {
            res.status(400).json({
                message: "taskId, date, and count are required",
            });
            return;
        }
        const record = await (0, repository_1.recordActivity)({
            userId: user.id,
            taskId,
            date,
            count,
            metadata,
        });
        res.status(201).json({ activity: record });
    }
    catch (error) {
        next(error);
    }
});
exports.activityRouter.get("/task/:taskId", async (req, res, next) => {
    try {
        const user = req.user;
        const { taskId } = req.params;
        const tasks = await (0, repository_1.getTasksForUser)(user.id);
        const task = tasks.find((t) => t.id === taskId);
        if (!task) {
            res.status(404).json({ message: "Task not found" });
            return;
        }
        const records = await (0, repository_1.getActivityForTask)(taskId);
        const heatmap = (0, heatmap_1.buildHeatmap)(task, records);
        res.json({ task, heatmap });
    }
    catch (error) {
        next(error);
    }
});
exports.activityRouter.get("/overview", async (req, res, next) => {
    try {
        const user = req.user;
        const tasks = await (0, repository_1.getTasksForUser)(user.id);
        const overview = [];
        for (const task of tasks) {
            const records = await (0, repository_1.getActivityForTask)(task.id);
            overview.push({
                task,
                heatmap: (0, heatmap_1.buildHeatmap)(task, records),
            });
        }
        res.json({ overview });
    }
    catch (error) {
        next(error);
    }
});
exports.activityRouter.get("/streaks", async (req, res, next) => {
    try {
        const user = req.user;
        const activities = await (0, repository_1.getActivityForUser)(user.id);
        const streakByTask = computeStreaks(activities);
        res.json({ streaks: streakByTask });
    }
    catch (error) {
        next(error);
    }
});
function computeStreaks(activities) {
    const byTask = new Map();
    const sorted = [...activities].sort((a, b) => a.date.localeCompare(b.date));
    for (const activity of sorted) {
        const entry = byTask.get(activity.taskId) ?? {
            current: 0,
            best: 0,
            lastDate: null,
        };
        if (!entry.lastDate) {
            entry.current = activity.count > 0 ? 1 : 0;
            entry.best = Math.max(entry.best, entry.current);
            entry.lastDate = activity.date;
            byTask.set(activity.taskId, entry);
            continue;
        }
        const previous = new Date(entry.lastDate);
        const current = new Date(activity.date);
        const diffDays = (current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays === 1 && activity.count > 0) {
            entry.current += 1;
        }
        else if (diffDays > 1 && activity.count > 0) {
            entry.current = 1;
        }
        else if (activity.count === 0) {
            entry.current = 0;
        }
        entry.best = Math.max(entry.best, entry.current);
        entry.lastDate = activity.date;
        byTask.set(activity.taskId, entry);
    }
    return Object.fromEntries(Array.from(byTask.entries()).map(([taskId, streak]) => [
        taskId,
        { current: streak.current, best: streak.best },
    ]));
}
//# sourceMappingURL=activityRoutes.js.map