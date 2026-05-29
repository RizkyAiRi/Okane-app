import { createClient } from '@/lib/supabase/client';
import type { Transaction, TransactionType, Category, CategorySummary, ChartDataPoint } from '@/lib/types';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

const supabase = createClient();

// ==================== TRANSACTIONS ====================

export async function getTransactions(options: {
  userId: string;
  type?: TransactionType;
  categoryId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  page?: number;
  pageSize?: number;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
}) {
  const {
    userId, type, categoryId, startDate, endDate, search,
    page = 1, pageSize = 20, orderBy = 'transaction_date', orderDir = 'desc'
  } = options;

  let query = supabase
    .from('transactions')
    .select('*, category:categories(*)', { count: 'exact' })
    .eq('user_id', userId);

  if (type) query = query.eq('type', type);
  if (categoryId) query = query.eq('category_id', categoryId);
  if (startDate) query = query.gte('transaction_date', startDate.toISOString());
  if (endDate) query = query.lte('transaction_date', endDate.toISOString());
  if (search) query = query.ilike('description', `%${search}%`);

  query = query.order(orderBy, { ascending: orderDir === 'asc' });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  return { data: data as (Transaction & { category: Category })[] | null, error, count };
}

export async function createTransaction(transaction: {
  user_id: string;
  type: TransactionType;
  amount: number;
  category_id: string;
  description?: string;
  transaction_date: string;
}) {
  const { data, error } = await supabase
    .from('transactions')
    .insert(transaction)
    .select('*, category:categories(*)')
    .single();
  return { data, error };
}

export async function updateTransaction(id: string, updates: Partial<Transaction>) {
  const { data, error } = await supabase
    .from('transactions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, category:categories(*)')
    .single();
  return { data, error };
}

export async function deleteTransaction(id: string) {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  return { error };
}

// ==================== CATEGORIES ====================

export async function getCategories(userId: string, type?: TransactionType) {
  let query = supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('name');

  if (type) query = query.eq('type', type);

  const { data, error } = await query;
  return { data: data as Category[] | null, error };
}

export async function createCategory(category: {
  user_id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
}) {
  const { data, error } = await supabase
    .from('categories')
    .insert({ ...category, is_default: false })
    .select()
    .single();
  return { data, error };
}

export async function updateCategory(id: string, updates: { name?: string; icon?: string; color?: string }) {
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  return { error };
}

// ==================== SUMMARIES ====================

export async function getDashboardSummary(userId: string) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const prevMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const prevMonthEnd = endOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));

  // Current month
  const { data: currentMonth } = await supabase
    .from('transactions')
    .select('type, amount')
    .eq('user_id', userId)
    .gte('transaction_date', monthStart.toISOString())
    .lte('transaction_date', monthEnd.toISOString());

  // Previous month
  const { data: prevMonth } = await supabase
    .from('transactions')
    .select('type, amount')
    .eq('user_id', userId)
    .gte('transaction_date', prevMonthStart.toISOString())
    .lte('transaction_date', prevMonthEnd.toISOString());

  // All time totals
  const { data: allTime } = await supabase
    .from('transactions')
    .select('type, amount')
    .eq('user_id', userId);

  const sumByType = (data: { type: string; amount: number }[] | null, type: string) =>
    (data || []).filter(t => t.type === type).reduce((sum, t) => sum + t.amount, 0);

  const currentIncome = sumByType(currentMonth, 'income');
  const currentExpense = sumByType(currentMonth, 'expense');
  const prevIncome = sumByType(prevMonth, 'income');
  const prevExpense = sumByType(prevMonth, 'expense');
  const totalIncome = sumByType(allTime, 'income');
  const totalExpense = sumByType(allTime, 'expense');

  return {
    totalBalance: totalIncome - totalExpense,
    monthlyIncome: currentIncome,
    monthlyExpense: currentExpense,
    prevMonthIncome: prevIncome,
    prevMonthExpense: prevExpense,
  };
}

export async function getChartData(userId: string, days: number = 7): Promise<ChartDataPoint[]> {
  const now = new Date();
  const startDate = subDays(now, days - 1);

  const { data } = await supabase
    .from('transactions')
    .select('type, amount, transaction_date')
    .eq('user_id', userId)
    .gte('transaction_date', startOfDay(startDate).toISOString())
    .lte('transaction_date', endOfDay(now).toISOString());

  const dateRange = eachDayOfInterval({ start: startDate, end: now });

  return dateRange.map(date => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayTransactions = (data || []).filter(t =>
      format(new Date(t.transaction_date), 'yyyy-MM-dd') === dateStr
    );

    return {
      label: format(date, 'dd MMM', { locale: idLocale }),
      date: dateStr,
      income: dayTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expense: dayTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    };
  });
}

export async function getCategorySummary(userId: string, type: TransactionType = 'expense', startDate?: Date, endDate?: Date): Promise<CategorySummary[]> {
  const now = new Date();
  const start = startDate || startOfMonth(now);
  const end = endDate || endOfMonth(now);

  const { data: transactions } = await supabase
    .from('transactions')
    .select('amount, category:categories(id, name, icon, color)')
    .eq('user_id', userId)
    .eq('type', type)
    .gte('transaction_date', start.toISOString())
    .lte('transaction_date', end.toISOString());

  if (!transactions || transactions.length === 0) return [];

  const categoryMap = new Map<string, CategorySummary>();
  let totalAll = 0;

  for (const t of transactions) {
    const cat = t.category as unknown as Category;
    if (!cat) continue;

    totalAll += t.amount;
    const existing = categoryMap.get(cat.id);
    if (existing) {
      existing.total += t.amount;
      existing.count += 1;
    } else {
      categoryMap.set(cat.id, {
        category_id: cat.id,
        category_name: cat.name,
        category_icon: cat.icon,
        category_color: cat.color,
        total: t.amount,
        count: 1,
        percentage: 0,
      });
    }
  }

  const result = Array.from(categoryMap.values());
  result.forEach(item => {
    item.percentage = totalAll > 0 ? (item.total / totalAll) * 100 : 0;
  });
  result.sort((a, b) => b.total - a.total);

  return result;
}

// ==================== RECURRING ====================

export async function getRecurringTemplates(userId: string) {
  const { data, error } = await supabase
    .from('recurring_templates')
    .select('*, category:categories(*)')
    .eq('user_id', userId)
    .order('next_due_date');
  return { data, error };
}

export async function getDueRecurring(userId: string) {
  const { data, error } = await supabase
    .from('recurring_templates')
    .select('*, category:categories(*)')
    .eq('user_id', userId)
    .eq('is_active', true)
    .lte('next_due_date', new Date().toISOString())
    .order('next_due_date');
  return { data, error };
}

export async function createRecurringTemplate(template: {
  user_id: string;
  category_id: string;
  type: TransactionType;
  default_amount: number;
  description?: string;
  frequency: string;
  next_due_date: string;
}) {
  const { data, error } = await supabase
    .from('recurring_templates')
    .insert(template)
    .select('*, category:categories(*)')
    .single();
  return { data, error };
}

export async function confirmRecurring(templateId: string, actualAmount: number, userId: string) {
  // Get the template
  const { data: template } = await supabase
    .from('recurring_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (!template) return { error: { message: 'Template not found' } };

  // Create the transaction
  const { error: txError } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      category_id: template.category_id,
      type: template.type,
      amount: actualAmount,
      description: template.description,
      transaction_date: new Date().toISOString(),
    });

  if (txError) return { error: txError };

  // Calculate next due date
  const current = new Date(template.next_due_date);
  let nextDate: Date;
  switch (template.frequency) {
    case 'daily': nextDate = new Date(current.setDate(current.getDate() + 1)); break;
    case 'weekly': nextDate = new Date(current.setDate(current.getDate() + 7)); break;
    case 'monthly': nextDate = new Date(current.setMonth(current.getMonth() + 1)); break;
    case 'yearly': nextDate = new Date(current.setFullYear(current.getFullYear() + 1)); break;
    default: nextDate = current;
  }

  // Update next due date
  const { error: updateError } = await supabase
    .from('recurring_templates')
    .update({ next_due_date: nextDate.toISOString() })
    .eq('id', templateId);

  return { error: updateError };
}

// ==================== SAVINGS GOALS ====================

export async function getSavingsGoals(userId: string) {
  const { data, error } = await supabase
    .from('savings_goals')
    .select('*')
    .eq('user_id', userId)
    .order('is_completed')
    .order('created_at', { ascending: false });
  return { data, error };
}

export async function createSavingsGoal(goal: {
  user_id: string;
  name: string;
  target_amount: number;
  target_date?: string;
  icon?: string;
  color?: string;
}) {
  const { data, error } = await supabase
    .from('savings_goals')
    .insert(goal)
    .select()
    .single();
  return { data, error };
}

export async function contributeToGoal(goalId: string, userId: string, amount: number, note?: string) {
  // Create contribution
  const { error: contribError } = await supabase
    .from('goal_contributions')
    .insert({ goal_id: goalId, user_id: userId, amount, note });

  if (contribError) return { error: contribError };

  // Update goal current_amount
  const { data: goal } = await supabase
    .from('savings_goals')
    .select('current_amount, target_amount')
    .eq('id', goalId)
    .single();

  if (goal) {
    const newAmount = goal.current_amount + amount;
    await supabase
      .from('savings_goals')
      .update({
        current_amount: newAmount,
        is_completed: newAmount >= goal.target_amount,
      })
      .eq('id', goalId);
  }

  return { error: null };
}

export async function getGoalContributions(goalId: string) {
  const { data, error } = await supabase
    .from('goal_contributions')
    .select('*')
    .eq('goal_id', goalId)
    .order('contributed_at', { ascending: false });
  return { data, error };
}
