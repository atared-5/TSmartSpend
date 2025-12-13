import React, { useState } from 'react';
import { useBudget } from '../context/BudgetContext';
import { ArrowLeft, Edit2, Save, Plus, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { BudgetPeriod } from '../types';

export const Budgets: React.FC = () => {
  const { period = 'monthly' } = useParams<{ period: string }>();
  const isWeekly = period === 'weekly';
  const budgetPeriod: BudgetPeriod = isWeekly ? 'WEEKLY' : 'MONTHLY';
  
  const { categories, budgets, setBudget, transactions, updateCategory, addCategory } = useBudget();
  const navigate = useNavigate();
  
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [editLimit, setEditLimit] = useState('');
  
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatIcon, setEditCatIcon] = useState('');

  const [isAdding, setIsAdding] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('💰');

  // Time calculations
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Helper for weekly range
  const getWeekRange = (date: Date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  };
  const currentWeek = getWeekRange(now);

  const getSpent = (categoryId: string) => {
    return transactions
      .filter(t => {
        const d = new Date(t.date);
        if (t.categoryId !== categoryId) return false;

        if (isWeekly) {
          return d >= currentWeek.start && d <= currentWeek.end;
        } else {
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }
      })
      .reduce((acc, t) => acc + t.amount, 0);
  };

  const handleEditLimit = (categoryId: string, currentLimit: number) => {
    setEditingBudgetId(categoryId);
    setEditLimit(currentLimit.toString());
  };

  const handleSaveLimit = (categoryId: string) => {
    if (editLimit) {
      setBudget(categoryId, parseFloat(editLimit), budgetPeriod);
      setEditingBudgetId(null);
    }
  };

  const handleEditCategory = (cat: {id: string, name: string, icon: string}) => {
    setEditingCategoryId(cat.id);
    setEditCatName(cat.name);
    setEditCatIcon(cat.icon);
  };

  const handleSaveCategory = (id: string) => {
    updateCategory(id, { name: editCatName, icon: editCatIcon });
    setEditingCategoryId(null);
  };

  const handleAddCategory = () => {
    if (newCatName && newCatIcon) {
        addCategory({
            name: newCatName,
            icon: newCatIcon,
            color: `#${Math.floor(Math.random()*16777215).toString(16)}` // Random color
        });
        setIsAdding(false);
        setNewCatName('');
    }
  };

  return (
    <div className="pb-20">
      <header className="flex items-center p-4 border-b border-slate-100 bg-white sticky top-0 z-10">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 text-slate-600">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-slate-900 ml-2 capitalize">{period} Budgets</h1>
      </header>

      <div className="p-4 space-y-6">
        <div className="bg-indigo-50 p-4 rounded-xl flex items-center justify-between">
           <p className="text-sm text-indigo-800 font-medium">
             {isWeekly 
               ? `This Week: ${currentWeek.start.toLocaleDateString()} - ${currentWeek.end.toLocaleDateString()}`
               : `This Month: ${now.toLocaleDateString('default', { month: 'long', year: 'numeric' })}`
             }
           </p>
        </div>

        <div className="space-y-4">
          {categories.map(cat => {
            const budget = budgets.find(b => b.categoryId === cat.id && b.period === budgetPeriod);
            const spent = getSpent(cat.id);
            const limit = budget?.limit || 0;
            const progress = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
            const isOverBudget = spent > limit && limit > 0;

            return (
              <div key={cat.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-start justify-between mb-3">
                  {editingCategoryId === cat.id ? (
                     <div className="flex items-center gap-2 flex-1 mr-2">
                        <input className="w-10 text-center border rounded p-1" value={editCatIcon} onChange={e => setEditCatIcon(e.target.value)} />
                        <input className="flex-1 border rounded p-1 text-sm" value={editCatName} onChange={e => setEditCatName(e.target.value)} autoFocus />
                        <button onClick={() => handleSaveCategory(cat.id)} className="bg-green-500 text-white p-1 rounded"><Check className="w-4 h-4"/></button>
                     </div>
                  ) : (
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => handleEditCategory(cat)}>
                        <span className="text-xl bg-slate-50 w-10 h-10 flex items-center justify-center rounded-full relative">
                            {cat.icon}
                            <Edit2 className="w-3 h-3 text-slate-400 absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </span>
                        <span className="font-medium text-slate-900">{cat.name}</span>
                    </div>
                  )}
                  
                  {editingBudgetId === cat.id ? (
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">฿</span>
                        <input 
                          type="number" 
                          value={editLimit}
                          onChange={(e) => setEditLimit(e.target.value)}
                          className="w-24 pl-5 py-1 border rounded text-sm outline-none focus:border-indigo-500"
                          autoFocus
                        />
                      </div>
                      <button onClick={() => handleSaveLimit(cat.id)} className="bg-indigo-600 text-white p-1.5 rounded-md">
                        <Save className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleEditLimit(cat.id, limit)}
                      className={`text-sm font-medium flex items-center gap-1 ${limit > 0 ? 'text-slate-900' : 'text-indigo-600'}`}
                    >
                      {limit > 0 ? `฿${limit.toLocaleString()}` : <><Plus className="w-4 h-4" /> Set Limit</>}
                      {limit > 0 && <Edit2 className="w-3 h-3 text-slate-400 ml-1" />}
                    </button>
                  )}
                </div>

                {limit > 0 && (
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span className={isOverBudget ? 'text-red-500 font-bold' : ''}>฿{spent.toLocaleString()} spent</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${isOverBudget ? 'bg-red-500' : 'bg-indigo-500'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Add Budget / Category */}
        {isAdding ? (
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 animate-in fade-in">
                <p className="text-sm font-bold text-slate-700 mb-2">New Budget Category</p>
                <div className="flex gap-2 mb-2">
                    <input 
                        className="w-12 border rounded p-2 text-center" 
                        placeholder="Icon" 
                        value={newCatIcon}
                        onChange={e => setNewCatIcon(e.target.value)}
                    />
                    <input 
                        className="flex-1 border rounded p-2 text-sm" 
                        placeholder="Title (e.g. Travel)" 
                        value={newCatName}
                        onChange={e => setNewCatName(e.target.value)}
                    />
                </div>
                <div className="flex justify-end gap-2">
                    <button onClick={() => setIsAdding(false)} className="px-3 py-1 text-xs text-slate-500">Cancel</button>
                    <button onClick={handleAddCategory} className="px-3 py-1 bg-indigo-600 text-white rounded text-xs font-bold">Add</button>
                </div>
            </div>
        ) : (
            <button onClick={() => setIsAdding(true)} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 flex items-center justify-center gap-2 hover:bg-slate-50 hover:border-slate-300 transition-all">
                <Plus className="w-5 h-5" /> Add Budget Category
            </button>
        )}
      </div>
    </div>
  );
};
