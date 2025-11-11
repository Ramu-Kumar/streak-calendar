import { useMemo } from "react";
import type { HeatmapDay } from "../types";
import "./Heatmap.css";

interface HeatmapProps {
  title?: string;
  days: HeatmapDay[];
  onSelectDay?: (day: HeatmapDay) => void;
}

const DAY_LABELS = ["Sun", "Tue", "Thu", "Sat"];

export function Heatmap({ days, onSelectDay, title }: HeatmapProps) {
  const weeks = useMemo(() => {
    const grouped: HeatmapDay[][] = [];
    for (let i = 0; i < days.length; i += 1) {
      const weekIndex = Math.floor(i / 7);
      if (!grouped[weekIndex]) {
        grouped[weekIndex] = [];
      }
      grouped[weekIndex].push(days[i]);
    }
    return grouped;
  }, [days]);

  return (
    <div className="heatmap">
      {title ? <h3 className="heatmap__title">{title}</h3> : null}
      <div className="heatmap__grid">
        <div className="heatmap__labels">
          {DAY_LABELS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className="heatmap__weeks">
          {weeks.map((week, columnIndex) => (
            <div className="heatmap__week" key={columnIndex}>
              {week.map((day) => (
                <button
                  key={day.date}
                  type="button"
                  className="heatmap__day"
                  style={{
                    backgroundColor: day.level?.color ?? "var(--heatmap-empty)",
                  }}
                  title={`${day.date}: ${day.count} activities`}
                  onClick={() => onSelectDay?.(day)}
                >
                  <span className="sr-only">
                    {day.date} - {day.count}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

