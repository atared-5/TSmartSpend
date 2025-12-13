import React, { createContext, useContext, useEffect, useState } from 'react';
import { Transaction, Source, Category, Budget, Goal, BudgetPeriod, TransactionType } from '../types';
import { DEFAULT_SOURCES, DEFAULT_CATEGORIES, STORAGE_KEY } from '../constants';

interface BudgetContextType {
  transactions: Transaction[];
  sources: Source[];
  categories: Category[];
  budgets: Budget[];
  goals: Goal[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addSource: (source: Omit<Source, 'id'>) => void;
  updateSource: (id: string, updates: Partial<Omit<Source, 'id'>>) => void;
  setBudget: (categoryId: string, limit: number, period: BudgetPeriod) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  getBalance: () => number;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export const BudgetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [sources, setSources] = useState<Source[]>(DEFAULT_SOURCES);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  // Load from local storage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      setTransactions(data.transactions || []);
      setSources(data.sources || DEFAULT_SOURCES);
      const storedCategories = data.categories || DEFAULT_CATEGORIES;
      setCategories(storedCategories);
      setBudgets(data.budgets || []);
      setGoals(data.goals || []);
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ transactions, sources, budgets, categories, goals }));
  }, [transactions, sources, budgets, categories, goals]);

  const addTransaction = (tx: Omit<Transaction, 'id'>) => {
    const newTx = { ...tx, id: crypto.randomUUID() };
    setTransactions(prev => [newTx, ...prev]);

    // Update source balance
    setSources(prev => prev.map(source => {
      if (source.id === tx.sourceId) {
        const change = tx.type === TransactionType.INCOME ? tx.amount : -tx.amount;
        return { ...source, balance: source.balance + change };
      }
      return source;
    }));
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    const oldTx = transactions.find(t => t.id === id);
    if (!oldTx) return;

    // Revert old balance effect
    setSources(prev => prev.map(source => {
      if (source.id === oldTx.sourceId) {
        const revertChange = oldTx.type === TransactionType.INCOME ? -oldTx.amount : oldTx.amount;
        return { ...source, balance: source.balance + revertChange };
      }
      return source;
    }));

    // Apply update
    const updatedTx = { ...oldTx, ...updates };
    setTransactions(prev => prev.map(t => t.id === id ? updatedTx : t));

    // Apply new balance effect
    setSources(prev => prev.map(source => {
      if (source.id === updatedTx.sourceId) {
         const change = updatedTx.type === TransactionType.INCOME ? updatedTx.amount : -updatedTx.amount;
        return { ...source, balance: source.balance + change };
      }
      return source;
    }));
  };

  const deleteTransaction = (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    setTransactions(prev => prev.filter(t => t.id !== id));

    // Revert balance
    setSources(prev => prev.map(source => {
      if (source.id === tx.sourceId) {
        const revertChange = tx.type === TransactionType.INCOME ? -tx.amount : tx.amount;
        return { ...source, balance: source.balance + revertChange };
      }
      return source;
    }));
  };

  const addSource = (sourceData: Omit<Source, 'id'>) => {
    const newSource = { ...sourceData, id: crypto.randomUUID() };
    setSources(prev => [...prev, newSource]);
  };

  const updateSource = (id: string, updates: Partial<Omit<Source, 'id'>>) => {
    setSources(prev => prev.map(source => {
      if (source.id === id) {
        return { ...source, ...updates };
      }
      return source;
    }));
  };

  const setBudget = (categoryId: string, limit: number, period: BudgetPeriod) => {
    setBudgets(prev => {
      const existing = prev.findIndex(b => b.categoryId === categoryId && b.period === period);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], limit };
        return updated;
      }
      return [...prev, { id: crypto.randomUUID(), categoryId, limit, period }];
    });
  };

  const addCategory = (category: Omit<Category, 'id'>) => {
    const newCat = { ...category, id: crypto.randomUUID() };
    setCategories(prev => [...prev, newCat]);
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const addGoal = (goal: Omit<Goal, 'id'>) => {
    setGoals(prev => [...prev, { ...goal, id: crypto.randomUUID() }]);
  };

  const updateGoal = (id: string, updates: Partial<Goal>) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const getBalance = () => sources.reduce((acc, s) => acc + s.balance, 0);

  return (
    <BudgetContext.Provider value={{
      transactions,
      sources,
      categories,
      budgets,
      goals,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addSource,
      updateSource,
      setBudget,
      addCategory,
      updateCategory,
      addGoal,
      updateGoal,
      deleteGoal,
      getBalance
    }}>
      {children}
    </BudgetContext.Provider>
  );
};

export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (!context) throw new Error("useBudget must be used within a BudgetProvider");
  return context;
};