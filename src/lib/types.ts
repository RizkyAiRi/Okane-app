// Database types for Okane

export type TransactionType = 'income' | 'expense';
export type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type ThemeMode = 'system' | 'dark' | 'light';
export type Language = 'id' | 'en';

export interface Profile {
  id: string;
  full_name: string | null;
  language: Language;
  theme: ThemeMode;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  is_default: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string | null;
  type: TransactionType;
  amount: number;
  description: string | null;
  transaction_date: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  category?: Category;
}

export interface RecurringTemplate {
  id: string;
  user_id: string;
  category_id: string | null;
  type: TransactionType;
  default_amount: number;
  description: string | null;
  frequency: Frequency;
  next_due_date: string;
  is_active: boolean;
  created_at: string;
  // Joined fields
  category?: Category;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  icon: string;
  color: string;
  is_completed: boolean;
  created_at: string;
}

export interface GoalContribution {
  id: string;
  goal_id: string;
  user_id: string;
  amount: number;
  note: string | null;
  contributed_at: string;
}

// Summary types
export interface PeriodSummary {
  total_income: number;
  total_expense: number;
  balance: number;
  transaction_count: number;
}

export interface CategorySummary {
  category_id: string;
  category_name: string;
  category_icon: string;
  category_color: string;
  total: number;
  count: number;
  percentage: number;
}

export interface ChartDataPoint {
  label: string;
  income: number;
  expense: number;
  date: string;
}
