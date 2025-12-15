import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useBudget } from '../context/BudgetContext';
import { Transaction } from '../types';

interface SpendingChartProps {
  customTransactions?: Transaction[];
}

export const SpendingChart: React.FC<SpendingChartProps> = ({ customTransactions }) => {
  const { transactions: allTransactions, categories } = useBudget();
  
  const transactionsToUse = customTransactions || allTransactions;

  // Filter for Current Month
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyTransactions = transactionsToUse.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const data = categories.map(cat => {
    const total = monthlyTransactions
      .filter(t => t.categoryId === cat.id)
      .reduce((sum, t) => sum + t.amount, 0);
    return { name: cat.name, value: total, color: cat.color };
  }).filter(item => item.value > 0);

  if (data.length === 0) {
    return (
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">
          Spending Breakdown ({now.toLocaleDateString('default', { month: 'long' })})
        </h3>
        <div className="h-64 flex items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm">
          No spending data for this month
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">
        Spending Breakdown ({now.toLocaleDateString('default', { month: 'long' })})
      </h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
                formatter={(value: number) => [`฿${value.toLocaleString()}`, 'Amount']}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};