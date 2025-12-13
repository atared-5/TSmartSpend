export enum TransactionType {
  EXPENSE = 'EXPENSE',
  INCOME = 'INCOME',
  TRANSFER = 'TRANSFER'
}

export interface Source {
  id: string;
  name: string;
  balance: number;
  type: 'BANK' | 'CASH' | 'OTHER';
  color: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Transaction {
  id: string;
  amount: number;
  sourceId: string;
  categoryId: string;
  date: string; // ISO string
  note: string;
  type: TransactionType;
}

export type BudgetPeriod = 'WEEKLY' | 'MONTHLY';

export interface Budget {
  id: string;
  categoryId: string;
  limit: number;
  period: BudgetPeriod;
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  periodicTarget?: number; // Optional savings target
}

export interface FinancialInsight {
  summary: string;
  spendingTrend: 'increasing' | 'decreasing' | 'stable';
  actionableTip: string;
}
