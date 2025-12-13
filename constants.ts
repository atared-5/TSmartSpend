import { Category, Source } from './types';

export const DEFAULT_SOURCES: Source[] = [
  { id: '1', name: 'Bank A', balance: 5000, type: 'BANK', color: 'bg-blue-500' },
  { id: '2', name: 'Bank B', balance: 6000, type: 'BANK', color: 'bg-indigo-500' },
  { id: '3', name: 'Cash', balance: 500, type: 'CASH', color: 'bg-green-500' },
];

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'food', name: 'Food & Dining', icon: '🍽️', color: '#ef4444' },
  { id: 'transport', name: 'Transportation', icon: '🚌', color: '#f59e0b' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#ec4899' },
  { id: 'personal', name: 'Personal Care', icon: '💇', color: '#8b5cf6' },
  { id: 'housing', name: 'Housing', icon: '🏠', color: '#3b82f6' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#10b981' },
  { id: 'utilities', name: 'Utilities', icon: '⚡', color: '#6366f1' },
  { id: 'health', name: 'Health', icon: '⚕️', color: '#ef4444' },
];

export const STORAGE_KEY = 'smartspend_data_v1';
