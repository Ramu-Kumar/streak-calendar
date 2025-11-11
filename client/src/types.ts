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

export interface HeatmapDay {
  date: string;
  count: number;
  level: IntensityLevel | null;
}

export interface TaskWithHeatmap {
  task: Task;
  heatmap: HeatmapDay[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

