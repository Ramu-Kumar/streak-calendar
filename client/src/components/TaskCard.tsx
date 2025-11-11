import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { TaskWithHeatmap } from "../types";
import { Heatmap } from "./Heatmap";
import { recordActivity } from "../api";

interface TaskCardProps {
  data: TaskWithHeatmap;
  onActivityLogged: () => void;
}

export function TaskCard({ data, onActivityLogged }: TaskCardProps) {
  const [count, setCount] = useState<number>(1);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const streakInfo = useMemo(() => computeStreaks(data.heatmap), [data.heatmap]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      await recordActivity({
        taskId: data.task.id,
        date,
        count,
      });
      onActivityLogged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="task-card">
      <header className="task-card__header">
        <div>
          <h2>{data.task.name}</h2>
          {data.task.description ? <p>{data.task.description}</p> : null}
        </div>
        <div className="task-card__streaks">
          <div>
            <span className="task-card__label">Current streak</span>
            <span className="task-card__value">{streakInfo.current}</span>
          </div>
          <div>
            <span className="task-card__label">Best streak</span>
            <span className="task-card__value">{streakInfo.best}</span>
          </div>
        </div>
      </header>

      <Heatmap days={data.heatmap} title="Past year" />

      <form className="task-card__form" onSubmit={handleSubmit}>
        <div className="task-card__inputs">
          <label>
            Date
            <input
              type="date"
              value={date}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </label>
          <label>
            Count
            <input
              type="number"
              min={1}
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
              required
            />
          </label>
        </div>
        <button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Log activity"}
        </button>
        {error ? <p className="task-card__error">{error}</p> : null}
      </form>
    </section>
  );
}

function computeStreaks(heatmap: TaskWithHeatmap["heatmap"]) {
  let current = 0;
  let best = 0;

  const sorted = [...heatmap].sort((a, b) => a.date.localeCompare(b.date));
  for (let i = 0; i < sorted.length; i += 1) {
    const day = sorted[i];
    if (day.count > 0) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }

  return { current, best };
}

