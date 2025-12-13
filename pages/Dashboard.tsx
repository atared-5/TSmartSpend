import React, { useState } from 'react';
import { useBudget } from '../context/BudgetContext';
import { SpendingChart } from '../components/Charts';
import { Plus, Wallet, TrendingUp, ChevronDown, ChevronUp, Sparkles, AlertCircle, Menu, FileText, CheckCircle2, Target } from 'lucide-react';
import { Link, useOutletContext, useNavigate } from 'react-router-dom';
import { analyzeFinances } from '../services/geminiService';
import { FinancialInsight } from '../types';

export const Dashboard: React.FC = () => {
  const { sources, transactions, categories, addSource, budgets, goals } = useBudget();
  const navigate = useNavigate();
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [insight, setInsight] = useState<FinancialInsight | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceBalance, setNewSourceBalance] = useState('');
  
  const { toggleSidebar } = useOutletContext<{ toggleSidebar: () => void }>();

  // Group spending by category
  const categorySpending = categories.map(cat => {
    const total = transactions
      .filter(t => t.categoryId === cat.id)
      .reduce((sum, t) => sum + t.amount, 0);
    return { ...cat, total };
  }).sort((a, b) => b.total - a.total);

  const topCategories = categorySpending.slice(0, 3);
  const otherCategories = categorySpending.slice(3);

  // Budget calculations for widget (Monthly default)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const activeBudgets = budgets.filter(b => b.limit > 0 && b.period === 'MONTHLY');

  const handleGeminiAnalysis = async () => {
    setLoadingInsight(true);
    const result = await analyzeFinances(transactions, sources, categories);
    setInsight(result);
    setLoadingInsight(false);
  };

  const handleAddSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSourceName && newSourceBalance) {
      const colors = [
        'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-lime-500', 'bg-green-500', 
        'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 
        'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 
        'bg-pink-500', 'bg-rose-500'
      ];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      addSource({
        name: newSourceName,
        balance: parseFloat(newSourceBalance),
        type: 'OTHER',
        color: randomColor
      });
      setNewSourceName('');
      setNewSourceBalance('');
      setIsAddingSource(false);
    }
  };

  return (
    <div className="pb-24">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <div>
           <h1 className="text-2xl font-bold text-slate-900">My Finances</h1>
           <p className="text-slate-500 text-sm">Welcome back!</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => navigate('/add?type=report')}
                className="p-2 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600 hover:bg-indigo-100"
                title="Add Report"
            >
                <FileText className="w-5 h-5" />
            </button>
            <button 
            onClick={toggleSidebar}
            className="p-2 bg-white border border-slate-200 rounded-full shadow-sm text-slate-600 hover:text-indigo-600 transition-colors"
            >
            <Menu className="w-5 h-5" />
            </button>
        </div>
      </header>

      {/* Goals Widget */}
      <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-slate-800">My Goals</h2>
              <div className="flex items-center gap-2">
                 <button 
                    onClick={() => navigate('/goals', { state: { openAdd: true } })}
                    className="text-indigo-600 text-sm font-medium flex items-center hover:text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg"
                 >
                    <Plus className="w-4 h-4 mr-1" /> Add Goal
                 </button>
                 <Link to="/goals" className="text-slate-400 text-xs font-bold uppercase tracking-wide px-2">View All</Link>
              </div>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
              {goals.length > 0 ? (
                  goals.map(goal => {
                      const percent = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
                      const isCompleted = goal.currentAmount >= goal.targetAmount && goal.targetAmount > 0;
                      
                      return (
                          <div key={goal.id} className={`min-w-[220px] bg-white p-4 rounded-xl border shadow-sm flex flex-col justify-between ${isCompleted ? 'border-green-200 bg-green-50/20' : 'border-slate-100'}`}>
                              <div>
                                <div className="flex justify-between items-start mb-1">
                                    <p className="font-bold text-slate-800 text-sm truncate pr-2">{goal.title}</p>
                                    {isCompleted && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
                                </div>
                                <div className="flex justify-between text-xs text-slate-500 mb-2">
                                    <span className="font-medium text-slate-900">฿{goal.currentAmount.toLocaleString()}</span>
                                    <span>of ฿{goal.targetAmount.toLocaleString()}</span>
                                </div>
                              </div>
                              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full transition-all duration-1000 ${isCompleted ? 'bg-green-500' : 'bg-indigo-500'}`} style={{ width: `${percent}%` }} />
                              </div>
                              {goal.periodicTarget && (
                                  <p className="text-[10px] text-slate-400 mt-2">Target: ฿{goal.periodicTarget.toLocaleString()}/mo</p>
                              )}
                          </div>
                      )
                  })
              ) : (
                  <button 
                    onClick={() => navigate('/goals', { state: { openAdd: true } })}
                    className="min-w-[200px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-100 hover:border-slate-300 transition-all"
                  >
                      <Target className="w-8 h-8 mb-2 opacity-50" />
                      <span className="text-xs font-bold">Create a Savings Goal</span>
                  </button>
              )}
          </div>
      </section>

      {/* Sources / Wallet Cards */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-800">Accounts</h2>
          <button 
            onClick={() => setIsAddingSource(!isAddingSource)}
            className="text-indigo-600 text-sm font-medium flex items-center hover:text-indigo-700"
          >
            <Plus className="w-4 h-4 mr-1" /> Add New
          </button>
        </div>
        
        {isAddingSource && (
          <form onSubmit={handleAddSource} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-4 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input 
                type="text" 
                placeholder="Name (e.g. Savings)" 
                className="border p-2 rounded text-sm w-full"
                value={newSourceName}
                onChange={e => setNewSourceName(e.target.value)}
                required
              />
              <input 
                type="number" 
                placeholder="Balance" 
                className="border p-2 rounded text-sm w-full"
                value={newSourceBalance}
                onChange={e => setNewSourceBalance(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
               <button type="button" onClick={() => setIsAddingSource(false)} className="text-slate-500 text-sm px-3 py-1">Cancel</button>
               <button type="submit" className="bg-indigo-600 text-white text-sm px-4 py-1 rounded-md">Save</button>
            </div>
          </form>
        )}

        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x">
          {sources.map(source => (
            <Link 
                to={`/account/${source.id}`}
                key={source.id} 
                className={`snap-center shrink-0 w-40 p-4 rounded-2xl text-white shadow-lg ${source.color} relative overflow-hidden transition-transform hover:scale-105 active:scale-95`}
            >
               <div className="absolute top-0 right-0 p-3 opacity-20">
                  <Wallet className="w-12 h-12" />
               </div>
               <p className="text-xs opacity-80 uppercase font-medium tracking-wider mb-1">{source.name}</p>
               <p className="text-xl font-bold">฿{source.balance.toLocaleString()}</p>
               <span className="text-[10px] opacity-70 mt-2 block">{source.type}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Budget Goals Widget (Monthly) */}
      {activeBudgets.length > 0 && (
        <section className="mb-8">
           <div className="flex items-center justify-between mb-3">
             <h2 className="text-lg font-semibold text-slate-800">Monthly Budgets</h2>
             <Link to="/budgets/monthly" className="text-indigo-600 text-xs font-bold uppercase tracking-wide">Manage</Link>
           </div>
           <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              {activeBudgets.slice(0, 3).map(budget => {
                  const cat = categories.find(c => c.id === budget.categoryId);
                  if (!cat) return null;
                  
                  const spent = transactions
                    .filter(t => {
                        const d = new Date(t.date);
                        return t.categoryId === cat.id && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                    })
                    .reduce((acc, t) => acc + t.amount, 0);
                  
                  const progress = Math.min((spent / budget.limit) * 100, 100);
                  const isOver = spent > budget.limit;

                  return (
                      <div key={budget.id}>
                          <div className="flex justify-between items-end mb-1">
                              <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                                 <span className="text-base">{cat.icon}</span> {cat.name}
                              </span>
                              <span className={`text-xs font-bold ${isOver ? 'text-red-500' : 'text-slate-500'}`}>
                                 ฿{spent.toLocaleString()} <span className="text-slate-300 font-normal">/ ฿{budget.limit.toLocaleString()}</span>
                              </span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${isOver ? 'bg-red-500' : 'bg-indigo-500'}`}
                                style={{ width: `${progress}%` }}
                              />
                          </div>
                      </div>
                  );
              })}
           </div>
        </section>
      )}

      {/* Gemini Insight */}
      <section className="mb-8">
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-2xl border border-indigo-100">
           <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-indigo-800">
                <Sparkles className="w-5 h-5" />
                <span className="font-semibold text-sm">Smart Insights</span>
              </div>
              <button 
                onClick={handleGeminiAnalysis} 
                disabled={loadingInsight}
                className="text-xs bg-white text-indigo-600 px-3 py-1.5 rounded-full shadow-sm font-medium border border-indigo-100 hover:bg-indigo-50 disabled:opacity-50"
              >
                {loadingInsight ? 'Analyzing...' : 'Analyze'}
              </button>
           </div>
           
           {insight ? (
             <div className="animate-in fade-in duration-500">
                <p className="text-sm text-slate-700 mb-2 leading-relaxed">{insight.summary}</p>
                <div className="flex items-start gap-2 bg-white p-3 rounded-lg border border-indigo-50/50 shadow-sm">
                   <TrendingUp className={`w-4 h-4 mt-0.5 ${insight.spendingTrend === 'increasing' ? 'text-red-500' : 'text-green-500'}`} />
                   <div>
                      <p className="text-xs font-bold text-slate-800 uppercase mb-0.5">Tip</p>
                      <p className="text-xs text-slate-600">{insight.actionableTip}</p>
                   </div>
                </div>
             </div>
           ) : (
             <p className="text-xs text-slate-500">Tap analyze to get AI-powered feedback on your spending habits.</p>
           )}
        </div>
      </section>

      {/* Charts */}
      <section className="mb-8">
        <SpendingChart />
      </section>

      {/* Category Breakdown */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Spending by Category</h2>
        <div className="space-y-3">
          {topCategories.map(cat => (
             <div key={cat.id} className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-50">
                <div className="flex items-center gap-3">
                  <span className="text-xl bg-slate-50 w-10 h-10 flex items-center justify-center rounded-full">{cat.icon}</span>
                  <div>
                    <p className="font-medium text-slate-900">{cat.name}</p>
                    <p className="text-xs text-slate-500">{transactions.filter(t => t.categoryId === cat.id).length} transactions</p>
                  </div>
                </div>
                <span className="font-bold text-slate-700">฿{cat.total.toLocaleString()}</span>
             </div>
          ))}

          {otherCategories.length > 0 && (
            <>
              <div className={`space-y-3 overflow-hidden transition-all duration-300 ${showAllCategories ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                {otherCategories.map(cat => (
                  <div key={cat.id} className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-50">
                      <div className="flex items-center gap-3">
                        <span className="text-xl bg-slate-50 w-10 h-10 flex items-center justify-center rounded-full">{cat.icon}</span>
                        <div>
                          <p className="font-medium text-slate-900">{cat.name}</p>
                          <p className="text-xs text-slate-500">{transactions.filter(t => t.categoryId === cat.id).length} transactions</p>
                        </div>
                      </div>
                      <span className="font-bold text-slate-700">฿{cat.total.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setShowAllCategories(!showAllCategories)}
                className="w-full flex items-center justify-center gap-2 text-slate-500 text-sm font-medium py-2 hover:text-slate-700"
              >
                {showAllCategories ? (
                  <>Show Less <ChevronUp className="w-4 h-4" /></>
                ) : (
                  <>View All Categories <ChevronDown className="w-4 h-4" /></>
                )}
              </button>
            </>
          )}

          {categorySpending.every(c => c.total === 0) && (
              <div className="text-center py-8 text-slate-400">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No transactions yet.</p>
              </div>
          )}
        </div>
      </section>
    </div>
  );
};
