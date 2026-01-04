export interface Contract {
  annualGoal: number;
  mentalPayRate: number;
  startDate: string;
}

export interface ValueEvent {
  id: string;
  date: string;
  description: string;
  units: number;
  unitType: string;
  payRate: number;
  amount: number;
  valueEventDefinitionId?: string;
}

export interface DrawingPath {
  path: string;
  color: string;
  width: number;
}

export interface DayHappenings {
  date: string;
  notes: string;
  drawingPaths?: DrawingPath[];
}

export interface UserProfile {
  displayName: string;
  avatarUri?: string;
}

export interface AppSettings {
  defaultPayRate: number;
  applePencilPressure: number;
  exportFormat: "pdf" | "csv";
}

export type ValueEventCategory = "happiness" | "success" | "prosperity";

export type ValueEventRecurrence = "daily" | "weekly" | "monthly" | "yearly";

export interface ValueEventDefinition {
  id: string;
  name: string;
  description?: string;
  category: ValueEventCategory;
  defaultUnits: number;
  unitType: string;
  payRateMultiplier: number;
  isActive: boolean;
  createdAt: string;
  usageCount: number;
  tags?: string[];
  recurrence: ValueEventRecurrence;
}

export const RECURRENCE_OPTIONS: { id: ValueEventRecurrence; label: string; icon: string }[] = [
  { id: "daily", label: "Daily", icon: "sun" },
  { id: "weekly", label: "Weekly", icon: "calendar" },
  { id: "monthly", label: "Monthly", icon: "grid" },
  { id: "yearly", label: "Yearly", icon: "award" },
];

export interface Affirmation {
  id: string;
  text: string;
  category?: "happiness" | "success" | "prosperity" | "general";
  createdAt: string;
  usageCount: number;
}

export interface DailyAffirmations {
  date: string;
  affirmationIds: string[];
  customAffirmations?: string[];
}

export interface RealityIncome {
  id: string;
  date: string;
  description: string;
  amount: number;
  source?: string;
}

export const DEFAULT_UNIT_TYPES = [
  "hours",
  "items",
  "pages",
  "tasks",
  "sessions",
  "clients",
  "projects",
  "words",
  "minutes",
];
