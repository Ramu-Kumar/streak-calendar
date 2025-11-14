import { useMemo } from "react";
import type { HeatmapDay } from "../types";
import "./Heatmap.css";

interface HeatmapProps {
  title?: string;
  days: HeatmapDay[];
  onSelectDay?: (day: HeatmapDay) => void;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_IN_MS = 86_400_000;

interface HeatmapSummary {
  totalCount: number;
  activeDays: number;
  currentStreak: number;
  maxStreak: number;
}

interface MonthCell {
  key: string;
  date: string;
  count: number;
  level: HeatmapDay["level"];
  column: number;
  row: number;
}

interface MonthGrid {
  key: string;
  label: string;
  columns: number;
  cells: MonthCell[];
}

function computeSummary(days: HeatmapDay[]): HeatmapSummary {
  let totalCount = 0;
  let activeDays = 0;
  let currentStreak = 0;
  let maxStreak = 0;
  let lastDate: Date | null = null;

  for (const day of days) {
    const date = new Date(day.date);
    totalCount += day.count;
    if (day.count > 0) {
      activeDays += 1;
      if (lastDate && date.getTime() - lastDate.getTime() === DAY_IN_MS) {
        currentStreak += 1;
      } else {
        currentStreak = 1;
      }
    } else {
      currentStreak = 0;
    }
    lastDate = date;
    maxStreak = Math.max(maxStreak, currentStreak);
  }

  return { totalCount, activeDays, currentStreak, maxStreak };
}

function buildMonthGrids(
  days: HeatmapDay[],
  lookup: Map<string, HeatmapDay>
): MonthGrid[] {
  if (days.length === 0) {
    return [];
  }

  const firstDay = new Date(days[0].date);
  const lastDay = new Date(days[days.length - 1].date);
  const startMonth = new Date(firstDay.getFullYear(), firstDay.getMonth(), 1);
  const endMonth = new Date(lastDay.getFullYear(), lastDay.getMonth(), 1);

  const months: MonthGrid[] = [];

  for (
    let cursor = new Date(startMonth);
    cursor <= endMonth;
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
  ) {
    const year = cursor.getFullYear();
    const monthIndex = cursor.getMonth();
    const monthKey = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
    const label = cursor.toLocaleString("default", { month: "short" });
    const monthStart = new Date(year, monthIndex, 1);
    const monthEnd = new Date(year, monthIndex + 1, 0);

    const startOffset = monthStart.getDay();
    const totalDays = monthEnd.getDate();
    const columnCount = Math.floor((startOffset + totalDays - 1) / 7) + 1;

    const cells: MonthCell[] = [];
    for (let day = 1; day <= totalDays; day += 1) {
      const current = new Date(year, monthIndex, day);
      const iso = current.toISOString().slice(0, 10);
      const actual = lookup.get(iso);
      const offset = startOffset + (day - 1);
      const column = Math.floor(offset / 7);
      const row = (offset % 7) + 1;
      cells.push({
        key: `day-${iso}`,
        date: iso,
        count: actual?.count ?? 0,
        level: actual?.level ?? null,
        column,
        row,
      });
    }

    months.push({
      key: monthKey,
      label,
      columns: columnCount,
      cells,
    });
  }

  return months;
}

export function Heatmap({ days, onSelectDay, title }: HeatmapProps) {
  const dayLookup = useMemo(() => {
    const map = new Map<string, HeatmapDay>();
    for (const day of days) {
      map.set(day.date, day);
    }
    return map;
  }, [days]);

  const summary = useMemo(() => computeSummary(days), [days]);
  const months = useMemo(
    () => buildMonthGrids(days, dayLookup),
    [days, dayLookup]
  );

  return (
    <div className="heatmap">
      <div className="heatmap__summary">
        {title ? <h3 className="heatmap__title">{title}</h3> : null}
        <div className="heatmap__stats">
          <span>{summary.totalCount} total entries</span>
          <span>{summary.activeDays} active days</span>
          <span>Max streak {summary.maxStreak}</span>
        </div>
      </div>
      <div className="heatmap__calendar">
        <div className="heatmap__labels">
          {DAY_LABELS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className="heatmap__months">
          {months.map((month) => (
            <div className="heatmap__month" key={month.key}>
              <div className="heatmap__month-header">{month.label}</div>
              <div
                className="heatmap__month-grid"
                style={{
                  gridTemplateColumns: `repeat(${month.columns}, var(--heatmap-week-width))`,
                }}
              >
                {month.cells.map((cell) => (
                  <button
                    key={cell.key}
                    type="button"
                    className="heatmap__day"
                    style={{
                      gridColumn: cell.column + 1,
                      gridRow: cell.row,
                      backgroundColor:
                        cell.level?.color ?? "var(--heatmap-empty)",
                    }}
                    title={`${cell.date}: ${cell.count} activities`}
                    onClick={() => {
                      const actual = dayLookup.get(cell.date);
                      if (actual) {
                        onSelectDay?.(actual);
                      }
                    }}
                  >
                    <span className="sr-only">
                      {`${cell.date} - ${cell.count}`}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

