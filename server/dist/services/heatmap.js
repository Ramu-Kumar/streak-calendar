"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildHeatmap = buildHeatmap;
const DEFAULT_DAYS = 365;
function buildHeatmap(task, records, totalDays = DEFAULT_DAYS) {
    const countsByDate = new Map();
    for (const record of records) {
        const current = countsByDate.get(record.date) ?? 0;
        countsByDate.set(record.date, current + record.count);
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = [];
    for (let i = totalDays - 1; i >= 0; i -= 1) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const isoDate = date.toISOString().slice(0, 10);
        const count = countsByDate.get(isoDate) ?? 0;
        const level = resolveIntensity(task.intensityLevels, count);
        days.push({ date: isoDate, count, level });
    }
    return days;
}
function resolveIntensity(levels, count) {
    if (count <= 0) {
        return null;
    }
    const sorted = [...levels].sort((a, b) => a.minCount - b.minCount);
    let matched = null;
    for (const level of sorted) {
        if (count >= level.minCount) {
            matched = level;
        }
        else {
            break;
        }
    }
    return matched;
}
//# sourceMappingURL=heatmap.js.map