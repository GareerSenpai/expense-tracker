export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  notes?: string;
}

export const EXPENSE_CATEGORIES: string[] = [
  'Food & Dining', 'Transportation', 'Housing & Rent', 'Entertainment',
  'Shopping', 'Healthcare', 'Education', 'Utilities', 'Travel', 'Other Expense'
];

export const INCOME_CATEGORIES: string[] = [
  'Salary', 'Freelance', 'Investment', 'Business', 'Gift', 'Other Income'
];

export const CATEGORY_COLORS: Record<string, string> = {
  'Food & Dining': '#f59e0b',
  'Transportation': '#60a5fa',
  'Housing & Rent': '#a78bfa',
  'Entertainment': '#f472b6',
  'Shopping': '#fb923c',
  'Healthcare': '#34d399',
  'Education': '#22d3ee',
  'Utilities': '#fbbf24',
  'Travel': '#818cf8',
  'Other Expense': '#94a3b8',
  'Salary': '#10b981',
  'Freelance': '#06b6d4',
  'Investment': '#8b5cf6',
  'Business': '#f59e0b',
  'Gift': '#ec4899',
  'Other Income': '#64748b'
};
