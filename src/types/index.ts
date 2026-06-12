export interface DailyHabit {
  date: string; // YYYY-MM-DD
  wakeup: number; // 0 or 1
  workout: number; // 0 or 1
  reading: number; // 0 or 1
  outreach: number; // 0 or 1
  project_session_1: number; // legacy
  project_session_2: number; // legacy
  calories_goal: number; // legacy
  protein_goal: number; // legacy
  sleep_8hr: number; // 0 or 1
  score: number; // percentage (0 to 100)
  notes?: string;
  
  // New checklist columns for refactored dashboard
  project_implementation: number; // 0 or 1
  research_learning: number; // 0 or 1
  nutrition: number; // 0 or 1
  prayers: number; // 0 or 1
  scrolling: number; // 0 or 1
  feeling_improved: number; // 0 or 1
}

export interface Meal {
  id?: number;
  date: string; // YYYY-MM-DD
  meal_text: string;
  calories: number;
  protein: number;
  carbs: number;
}

export interface OutreachEntry {
  id?: number;
  date: string; // YYYY-MM-DD
  category: string;
  business_name: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  twitter?: string;
  email?: string;
}

export interface Project {
  id?: number;
  title: string;
  category: string;
  tech_stack: string;
  amount: number;
  expected_duration: string; // e.g., "2 weeks"
  completed: number; // 0 or 1
  completion_date?: string; // YYYY-MM-DD
  total_hours: number;
  total_days: number;
}

export interface ProjectLog {
  id?: number;
  project_id: number;
  date: string; // YYYY-MM-DD
  hours_worked: number;
}

export interface OutreachCategory {
  id?: number;
  name: string;
}
