export type TaskStatus =
  | "todo"
  | "in_progress"
  | "pending_review"
  | "completed";
export type TaskPriority = "high" | "medium" | "low";

export type Task = {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category_id?: string;
  due_date?: string;
  position: number;
  created_at: string;
  subtask_count?: number;
  completed_subtask_count?: number;
};

export type Subtask = {
  id: string;
  task_id: string;
  title: string;
  completed: boolean;
  created_at: string;
};

export const TASK_CATEGORIES = [
  { id: "academic", label: "Academic", color: "#4f8ef7" },
  { id: "personal", label: "Personal", color: "#639922" },
  { id: "group_project", label: "Group Project", color: "#534AB7" },
  { id: "freelance", label: "Freelance", color: "#BA7517" },
  { id: "errands", label: "Errands", color: "#1D9E75" },
  { id: "health", label: "Health", color: "#A32D2D" },
  { id: "financial", label: "Financial", color: "#166534" },
];

export const COLUMN_CONFIG: {
  id: TaskStatus;
  label: string;
  color: string;
}[] = [
  { id: "todo", label: "To Do", color: "#4f8ef7" },
  { id: "in_progress", label: "In Progress", color: "#BA7517" },
  { id: "pending_review", label: "Pending Review", color: "#534AB7" },
  { id: "completed", label: "Completed", color: "#639922" },
];

export const PRIORITY_CONFIG: {
  id: TaskPriority;
  label: string;
  color: string;
}[] = [
  { id: "high", label: "High", color: "#B91C1C" },
  { id: "medium", label: "Medium", color: "#B45309" },
  { id: "low", label: "Low", color: "#166534" },
];
