import React, { useState } from 'react';
import { useBudget } from '../context/BudgetContext';
import { SpendingChart } from '../components/Charts';
import { Plus, Wallet, ChevronDown, ChevronUp, AlertCircle, Menu, CheckCircle2, Target, X, List, PieChart } from 'lucide-react';
import { Link, useOutletContext, useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { sources, transactions, categories, addSource, budgets, goals } = useBudget();
  const navigate = useNavigate();
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceBalance, setNewSourceBalance] = useState('');
  
  // View Toggle State: 'transactions' (Latest) or 'breakdown' (Totals)
  const [viewMode, setViewMode] = useState<'transactions' | 'breakdown'>('transactions');
  const [visibleCount, setVisibleCount] = useState(4);
  const [showAllCategories, setShowAllCategories] = useState(false);
  
  // State for category detail modal
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  
  const { toggleSidebar } = useOutletContext<{ toggleSidebar: () => void }>();

  // Filter transactions for current month
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const monthlyTransactions = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  // Sort by date descending (newest first)
  monthlyTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Group spending by category (Monthly) for Breakdown View
  const categorySpending = categories.map(cat => {
    const total = monthlyTransactions
      .filter(t => t.categoryId === cat.id)
      .reduce((sum, t) => sum + t.amount, 0); // Note: showing raw total (incomes + expenses mixed if same cat, usually categories are one type)
                                               // ideally we filter for Expenses mostly for spending chart, but logic remains same as before.
    return { ...cat, total };
  }).sort((a, b) => b.total - a.total);

  const topCategories = categorySpending.slice(0, 3);
  const otherCategories = categorySpending.slice(3);

  const activeBudgets = budgets.filter(b => b.limit > 0 && b.period === 'MONTHLY');

  // Selected Category Data for Modal (All time history for that category)
  const selectedCategory = categories.find(c => c.id === selectedCategoryId);
  const selectedCategoryTransactions = selectedCategoryId 
    ? transactions
        .filter(t => t.categoryId === selectedCategoryId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

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
        <button 
            onClick={toggleSidebar}
            className="p-2 bg-white border border-slate-200 rounded-full shadow-sm text-slate-600 hover:text-indigo-600 transition-colors"
        >
            <Menu className="w-5 h-5" />
        </button>
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

      {/* Charts */}
      <section className="mb-8">
        <SpendingChart />
      </section>

      {/* Monthly Activity Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">
                Activity in {now.toLocaleDateString('default', { month: 'long' })}
            </h2>
            
            {/* View Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
                <button 
                    onClick={() => setViewMode('transactions')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'transactions' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <List className="w-3.5 h-3.5" /> Latest
                </button>
                <button 
                    onClick={() => setViewMode('breakdown')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'breakdown' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <PieChart className="w-3.5 h-3.5" /> Breakdown
                </button>
            </div>
        </div>
        
        <div className="space-y-3 min-h-[200px]">
          {monthlyTransactions.length === 0 ? (
               <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-100 border-dashed">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No transactions this month.</p>
               </div>
          ) : viewMode === 'transactions' ? (
            /* --- Transactions View --- */
            <div className="animate-in fade-in slide-in-from-bottom-2 space-y-3">
               {monthlyTransactions.slice(0, visibleCount).map(tx => {
                  const cat = categories.find(c => c.id === tx.categoryId);
                  const isExpense = tx.type === 'EXPENSE';
                  return (
                      <div key={tx.id} className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-50">
                          <div className="flex items-center gap-3 overflow-hidden">
                              <span className="text-xl bg-slate-50 w-10 h-10 flex items-center justify-center rounded-full shrink-0">
                                  {cat?.icon || '💸'}
                              </span>
                              <div className="min-w-0">
                                  <p className="font-medium text-slate-900 truncate">{cat?.name || 'Uncategorized'}</p>
                                  {tx.note && <p className="text-xs text-slate-500 truncate">{tx.note}</p>}
                                  <p className="text-[10px] text-slate-400 mt-0.5">
                                      {new Date(tx.date).toLocaleDateString(undefined, {month:'short', day:'numeric'})} • {new Date(tx.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                  </p>
                              </div>
                          </div>
                          <span className={`font-bold whitespace-nowrap ml-2 ${isExpense ? 'text-slate-900' : 'text-green-600'}`}>
                              {isExpense ? '- ' : '+ '}฿{tx.amount.toLocaleString()}
                          </span>
                      </div>
                  );
               })}
               
               {monthlyTransactions.length > 4 && (
                   <button 
                     onClick={() => setVisibleCount(visibleCount === 4 ? monthlyTransactions.length : 4)}
                     className="w-full py-2 text-sm text-indigo-600 font-medium hover:bg-indigo-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                   >
                     {visibleCount === 4 ? (
                        <>Show More <ChevronDown className="w-4 h-4" /></>
                     ) : (
                        <>Show Less <ChevronUp className="w-4 h-4" /></>
                     )}
                   </button>
               )}
            </div>
          ) : (
            /* --- Category Breakdown View (Old Logic) --- */
            <div className="animate-in fade-in slide-in-from-bottom-2 space-y-3">
                {topCategories.map(cat => (
                    <button 
                        key={cat.id} 
                        onClick={() => setSelectedCategoryId(cat.id)}
                        className="w-full flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-50 hover:bg-slate-50 transition-all active:scale-[0.99] text-left"
                    >
                        <div className="flex items-center gap-3">
                        <span className="text-xl bg-slate-50 w-10 h-10 flex items-center justify-center rounded-full">{cat.icon}</span>
                        <div>
                            <p className="font-medium text-slate-900">{cat.name}</p>
                            <p className="text-xs text-slate-500">{monthlyTransactions.filter(t => t.categoryId === cat.id).length} transactions</p>
                        </div>
                        </div>
                        <span className="font-bold text-slate-700">฿{cat.total.toLocaleString()}</span>
                    </button>
                ))}

                {otherCategories.length > 0 && (
                    <>
                    <div className={`space-y-3 overflow-hidden transition-all duration-300 ${showAllCategories ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                        {otherCategories.map(cat => (
                        <button 
                            key={cat.id} 
                            onClick={() => setSelectedCategoryId(cat.id)}
                            className="w-full flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-50 hover:bg-slate-50 transition-all active:scale-[0.99] text-left"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xl bg-slate-50 w-10 h-10 flex items-center justify-center rounded-full">{cat.icon}</span>
                                <div>
                                <p className="font-medium text-slate-900">{cat.name}</p>
                                <p className="text-xs text-slate-500">{monthlyTransactions.filter(t => t.categoryId === cat.id).length} transactions</p>
                                </div>
                            </div>
                            <span className="font-bold text-slate-700">฿{cat.total.toLocaleString()}</span>
                        </button>
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
            </div>
          )}
        </div>
      </section>

      {/* Category Details Modal */}
      {selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
          {/* Backdrop */}
          <div 
             className="absolute inset-0 bg-black/40 pointer-events-auto backdrop-blur-sm transition-opacity" 
             onClick={() => setSelectedCategoryId(null)} 
          />
          
          {/* Panel */}
          <div className="bg-white w-full max-w-md h-[80vh] sm:h-auto sm:max-h-[80vh] sm:rounded-3xl rounded-t-3xl shadow-2xl pointer-events-auto flex flex-col animate-in slide-in-from-bottom-4 relative">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white rounded-t-3xl sticky top-0 z-10">
                  <div className="flex items-center gap-3">
                      <span className="text-3xl bg-indigo-50 w-12 h-12 flex items-center justify-center rounded-2xl">{selectedCategory.icon}</span>
                      <div>
                          <h3 className="font-bold text-xl text-slate-900">{selectedCategory.name}</h3>
                          <p className="text-sm text-slate-500">{selectedCategoryTransactions.length} transactions total</p>
                      </div>
                  </div>
                  <button onClick={() => setSelectedCategoryId(null)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500">
                    <X className="w-5 h-5" />
                  </button>
              </div>

              <div className="overflow-y-auto p-4 flex-1">
                  {selectedCategoryTransactions.length > 0 ? (
                      <div className="space-y-3">
                          {selectedCategoryTransactions.map(tx => (
                              <div key={tx.id} className="flex items-center justify-between bg-slate-50 p-4 rounded-xl">
                                  <div>
                                      <p className="text-sm font-bold text-slate-900">
                                        {new Date(tx.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                      </p>
                                      {tx.note ? (
                                        <p className="text-xs text-slate-500 mt-0.5">{tx.note}</p>
                                      ) : (
                                        <p className="text-xs text-slate-400 italic mt-0.5">No note</p>
                                      )}
                                  </div>
                                  <div className="text-right">
                                     <span className="font-bold text-slate-900 block">฿{tx.amount.toLocaleString()}</span>
                                     <span className="text-transaction-400 text-[10px] text-slate-400">{new Date(tx.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                  </div>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 min-h-[200px]">
                          <AlertCircle className="w-10 h-10 mb-2 opacity-30" />
                          <p>No transactions found for this category.</p>
                      </div>
                  )}
              </div>
          </div>
        </div>
      )}
    </div>
  );
};