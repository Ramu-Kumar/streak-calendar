export interface IntensityLevel {
  label: string;
  minCount: number;
  color: string;
}

export interface Task {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: string;
  intensityLevels: IntensityLevel[];
}

export interface ActivityRecord {
  id: string;
  taskId: string;
  userId: string;
  date: string; // ISO date yyyy-mm-dd
  count: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  googleId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseSchema {
  users: User[];
  tasks: Task[];
  activity: ActivityRecord[];
}

export interface HeatmapDay {
  date: string;
  count: number;
  level: IntensityLevel | null;
}

export interface TaskWithHeatmap {
  task: Task;
  heatmap: HeatmapDay[];
}

