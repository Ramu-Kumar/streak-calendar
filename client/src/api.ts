import type { TaskWithHeatmap, User, Task, IntensityLevel } from "./types";

const API_URL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV
    ? "http://localhost:4000"
    : typeof window !== "undefined"
      ? window.location.origin
      : "");

interface FetchOptions extends RequestInit {
  skipAuthRedirect?: boolean;
}

async function apiFetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (response.status === 401 && !options.skipAuthRedirect) {
    throw new Error("unauthorized");
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = body.message ?? response.statusText;
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const data = await apiFetch<{ user: User }>("/api/user/me", {
      method: "GET",
      skipAuthRedirect: true,
    });
    return data.user;
  } catch {
    return null;
  }
}

export function getGoogleLoginUrl(): string {
  return `${API_URL}/auth/google`;
}

export async function logout(): Promise<void> {
  await apiFetch("/auth/logout", {
    method: "POST",
  });
}

export async function fetchTasks(
  includeHeatmap = true
): Promise<TaskWithHeatmap[] | Task[]> {
  const params = new URLSearchParams();
  if (includeHeatmap) {
    params.set("includeHeatmap", "true");
  }
  const url = `/api/tasks${params.toString() ? `?${params.toString()}` : ""}`;
  const data = await apiFetch<{ tasks: TaskWithHeatmap[] | Task[] }>(url, {
    method: "GET",
  });
  return data.tasks;
}

export async function createTask(payload: {
  name: string;
  description?: string;
  intensityLevels?: IntensityLevel[];
}): Promise<Task> {
  const data = await apiFetch<{ task: Task }>("/api/tasks", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.task;
}

export async function recordActivity(payload: {
  taskId: string;
  date: string;
  count: number;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await apiFetch("/api/activity", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchTaskHeatmap(
  taskId: string
): Promise<TaskWithHeatmap> {
  const data = await apiFetch<{ task: Task; heatmap: TaskWithHeatmap["heatmap"] }>(
    `/api/activity/task/${taskId}`,
    { method: "GET" }
  );
  return { task: data.task, heatmap: data.heatmap };
}

