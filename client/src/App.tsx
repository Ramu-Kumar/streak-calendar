import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import "./App.css";
import {
  createTask,
  fetchCurrentUser,
  fetchTasks,
  getGoogleLoginUrl,
  logout,
} from "./api";
import type { IntensityLevel, TaskWithHeatmap, User } from "./types";
import { TaskCard } from "./components/TaskCard";

const DEFAULT_INTENSITY: IntensityLevel[] = [
  { label: "Light", minCount: 1, color: "#9be9a8" },
  { label: "Medium", minCount: 3, color: "#40c463" },
  { label: "Heavy", minCount: 5, color: "#216e39" },
];

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<TaskWithHeatmap[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [intensityLevels, setIntensityLevels] = useState<IntensityLevel[]>(
    DEFAULT_INTENSITY
  );
  const [isCreating, setIsCreating] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [me, tasksResponse] = await Promise.all([
        fetchCurrentUser(),
        fetchTasks(true).catch(() => null),
      ]);
      setUser(me);
      if (me && Array.isArray(tasksResponse)) {
        setTasks(tasksResponse as TaskWithHeatmap[]);
      } else {
        setTasks([]);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Task name is required");
      return;
    }

    setIsCreating(true);
    setError(null);
    try {
      await createTask({
        name: name.trim(),
        description: description.trim() || undefined,
        intensityLevels,
      });
      setName("");
      setDescription("");
      setIntensityLevels(DEFAULT_INTENSITY);
      await loadData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setTasks([]);
  };

  const onActivityLogged = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const intensityPalette = useMemo(
    () =>
      intensityLevels.map((level, index) => ({
        ...level,
        id: `${level.label}-${index}`,
      })),
    [intensityLevels]
  );

  if (!user) {
    return (
      <main className="login-card">
        <h1 className="login-card__title">Consistency Heatmap</h1>
        <p className="login-card__subtitle">
          Visualize your daily streak across tasks you care about. Sign in with
          Google to get started.
        </p>
        <button
          type="button"
          onClick={() => {
            window.location.href = getGoogleLoginUrl();
          }}
        >
          Continue with Google
        </button>
        {error ? <p className="task-card__error">{error}</p> : null}
        <p className="login-card__subtitle">
          Future update: live presence and realtime streak nudges.
        </p>
      </main>
    );
  }

  return (
    <main className="app">
      <header className="app__header">
        <div>
          <h1>Consistency Heatmap</h1>
          <p>
            Track streaks for learning, workouts, or any habit. Your heatmap
            updates as you log activity.
          </p>
        </div>
        <div className="session">
          {user.avatarUrl ? <img src={user.avatarUrl} alt={user.name} /> : null}
          <div>
            <strong>{user.name}</strong>
            <div style={{ fontSize: "0.85rem", color: "rgba(240,243,246,0.7)" }}>
              {user.email}
            </div>
          </div>
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <section className="task-form">
        <h2 style={{ margin: 0 }}>Create a task</h2>
        <p style={{ margin: "0 0 1rem", color: "rgba(240,243,246,0.65)" }}>
          Configure intensity thresholds to match your routine. More activity
          means a darker cell.
        </p>
        <form onSubmit={handleCreateTask} className="task-form__fields">
          <label>
            Task name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Watch Udemy lessons"
              required
            />
          </label>
          <label>
            Description
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Short blurb to remind you why this matters"
            />
          </label>
          <div className="task-form__intensity">
            {intensityPalette.map((level, index) => (
              <label key={level.id}>
                {level.label} min count
                <input
                  type="number"
                  min={index === 0 ? 1 : intensityLevels[index - 1].minCount + 1}
                  value={level.minCount}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setIntensityLevels((prev) => {
                      const next = [...prev];
                      next[index] = { ...next[index], minCount: value };
                      return next;
                    });
                  }}
                />
              </label>
            ))}
          </div>
          <div style={{ alignSelf: "flex-end" }}>
            <button type="submit" disabled={isCreating}>
              {isCreating ? "Creating..." : "Add task"}
            </button>
          </div>
        </form>
        {error ? <p className="task-card__error">{error}</p> : null}
      </section>

      {isLoading ? (
        <div className="tasks-empty">
          <h3>Loading your heatmaps...</h3>
          <p>Fetching tasks and streak history.</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="tasks-empty">
          <h3>No tasks yet</h3>
          <p>
            Create a task above, then log activity each day to see your streak
            calendar animate.
          </p>
        </div>
      ) : (
        <section className="tasks-grid">
          {tasks.map((task) => (
            <TaskCard
              key={task.task.id}
              data={task}
              onActivityLogged={onActivityLogged}
            />
          ))}
        </section>
      )}
    </main>
  );
}

export default App;
