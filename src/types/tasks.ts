export type TaskStatus =
  | "todo"
  | "in_progress"
  | "pending_review"
  | "completed";

export type TaskPriority = "low" | "medium" | "high";

export type Subtask = {
  id: string;
  task_id: string;
  title: string;
  completed: boolean;
  position: number;
};

export type Task = {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category?: string;
  due_date?: string;
  position: number;
  created_at: string;
  subtask_total: number;
  subtask_completed: number;
  subtasks: Subtask[];
};

export type TaskCategory = {
  id: string;
  label: string;
  color: string;
};

export const TASK_CATEGORIES: TaskCategory[] = [
  { id: "course_work", label: "Course Work", color: "#639922" },
  { id: "design_media", label: "Design & Media", color: "#4f8ef7" },
  { id: "academic", label: "Academic", color: "#A32D2D" },
  { id: "independent_work", label: "Independent Work", color: "#BA7517" },
  { id: "collaborative", label: "Collaborative", color: "#534AB7" },
  { id: "online_platform", label: "Online Platform", color: "#0F6E56" },
  { id: "personal", label: "Personal", color: "#D85A30" },
];

export const COLUMN_CONFIG: Record<
  TaskStatus,
  { label: string; color: string }
> = {
  todo: { label: "To Do", color: "#888780" },
  in_progress: { label: "In Progress", color: "#4f8ef7" },
  pending_review: { label: "Pending Review", color: "#BA7517" },
  completed: { label: "Completed", color: "#639922" },
};

export const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; color: string }
> = {
  high: { label: "High Priority", color: "#A32D2D" },
  medium: { label: "Medium Priority", color: "#BA7517" },
  low: { label: "Low Priority", color: "#639922" },
};
