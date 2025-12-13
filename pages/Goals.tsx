import React, { useState, useEffect } from 'react';
import { useBudget } from '../context/BudgetContext';
import { ArrowLeft, Plus, Trophy, Trash2, Coins, X, CheckCircle2, Target, Edit2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Goal, TransactionType } from '../types';

export const Goals: React.FC = () => {
  const { goals, addGoal, updateGoal, deleteGoal, sources, addTransaction, categories } = useBudget();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdding, setIsAdding] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  
  // Auto-open add form if passed in state
  useEffect(() => {
    if (location.state && (location.state as any).openAdd) {
        setIsAdding(true);
        setEditingGoalId(null);
        window.history.replaceState({}, document.title)
    }
  }, [location]);

  // Form State
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('');
  const [periodic, setPeriodic] = useState('');

  // Deposit State
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositSourceId, setDepositSourceId] = useState('');

  // Celebration State
  const [celebratedGoal, setCelebratedGoal] = useState<string | null>(null);

  const resetForm = () => {
      setIsAdding(false);
      setEditingGoalId(null);
      setTitle('');
      setTarget('');
      setCurrent('');
      setPeriodic('');
  };

  const handleAddOrUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (title && target) {
      if (editingGoalId) {
          updateGoal(editingGoalId, {
            title,
            targetAmount: parseFloat(target),
            currentAmount: parseFloat(current) || 0,
            periodicTarget: parseFloat(periodic) || undefined
          });
      } else {
          addGoal({
            title,
            targetAmount: parseFloat(target),
            currentAmount: parseFloat(current) || 0,
            periodicTarget: parseFloat(periodic) || undefined
          });
      }
      resetForm();
    }
  };

  const handleEdit = (goal: Goal) => {
      setTitle(goal.title);
      setTarget(goal.targetAmount.toString());
      setCurrent(goal.currentAmount.toString());
      setPeriodic(goal.periodicTarget?.toString() || '');
      setEditingGoalId(goal.id);
      setIsAdding(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openDeposit = (goalId: string) => {
      setDepositGoalId(goalId);
      setDepositAmount('');
      // Default to first source
      if (sources.length > 0) {
          setDepositSourceId(sources[0].id);
      }
  };

  const handleDeposit = (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (goal && depositAmount && depositSourceId) {
        const amount = parseFloat(depositAmount);
        const source = sources.find(s => s.id === depositSourceId);
        
        if (!source) return;

        // Check sufficient funds (optional but good UX)
        if (source.balance < amount) {
            alert(`Insufficient funds in ${source.name}`);
            return;
        }

        const newTotal = goal.currentAmount + amount;
        
        // Check for celebration before updating
        if (newTotal >= goal.targetAmount && goal.currentAmount < goal.targetAmount) {
            setCelebratedGoal(goal.title);
        }

        // 1. Update Goal
        updateGoal(goalId, { currentAmount: newTotal });

        // 2. Create Transaction to deduct from source
        // We use the first category as a fallback, or if there is a 'Savings' category.
        // This ensures the money is deducted from the source balance in the system.
        const categoryId = categories[0]?.id; // Required by type, safe fallback
        
        addTransaction({
            amount: amount,
            sourceId: source.id,
            categoryId: categoryId,
            date: new Date().toISOString(),
            note: `Deposit to goal: ${goal.title}`,
            type: TransactionType.EXPENSE 
        });
        
        setDepositGoalId(null);
        setDepositAmount('');
        setDepositSourceId('');
    }
  };

  return (
    <div className="pb-20 min-h-screen bg-slate-50">
      <header className="flex items-center justify-between p-4 border-b border-slate-100 bg-white sticky top-0 z-10">
        <div className="flex items-center">
            <button onClick={() => navigate('/')} className="p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-full">
            <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-slate-900 ml-2">Savings Goals</h1>
        </div>
        {!isAdding && (
            <button 
                onClick={() => { setIsAdding(true); setEditingGoalId(null); setTitle(''); setTarget(''); setCurrent(''); setPeriodic(''); }} 
                className="flex items-center gap-1 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full text-sm font-bold hover:bg-indigo-100 transition-colors"
            >
                <Plus className="w-4 h-4" /> Add Goal
            </button>
        )}
      </header>

      <div className="p-4 space-y-6">
        {isAdding && (
           <form onSubmit={handleAddOrUpdate} className="bg-white p-6 rounded-2xl shadow-xl border border-indigo-100 mb-6 animate-in slide-in-from-top-4">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-xl text-indigo-900 flex items-center gap-2">
                    {editingGoalId ? <Edit2 className="w-5 h-5 text-indigo-600" /> : <Target className="w-5 h-5 text-indigo-600" />}
                    {editingGoalId ? 'Edit Goal' : 'New Goal'}
                  </h3>
                  <button type="button" onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
              </div>
              
              <div className="space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Goal Title</label>
                    <input 
                        required 
                        className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl focus:bg-white focus:ring-2 ring-indigo-500 outline-none transition-all font-medium text-slate-900" 
                        placeholder="e.g. Dream Vacation" 
                        value={title} 
                        onChange={e => setTitle(e.target.value)} 
                        autoFocus
                    />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Total Target</label>
                        <div className="relative">
                            <span className="absolute left-3 top-3 text-slate-400 font-bold">฿</span>
                            <input 
                                required 
                                type="number" 
                                className="w-full border border-slate-200 bg-slate-50 p-3 pl-8 rounded-xl focus:bg-white focus:ring-2 ring-indigo-500 outline-none transition-all font-bold text-slate-900" 
                                placeholder="0" 
                                value={target} 
                                onChange={e => setTarget(e.target.value)} 
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Saved So Far</label>
                        <div className="relative">
                            <span className="absolute left-3 top-3 text-slate-400 font-bold">฿</span>
                            <input 
                                type="number" 
                                className="w-full border border-slate-200 bg-slate-50 p-3 pl-8 rounded-xl focus:bg-white focus:ring-2 ring-indigo-500 outline-none transition-all font-bold text-slate-900" 
                                placeholder="0" 
                                value={current} 
                                onChange={e => setCurrent(e.target.value)} 
                            />
                        </div>
                    </div>
                 </div>

                 <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                    <label className="block text-xs font-bold text-indigo-800 mb-1.5 uppercase tracking-wide">Monthly/Weekly Contribution</label>
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-indigo-300 font-bold">฿</span>
                        <input 
                            type="number" 
                            className="w-full border border-indigo-200 bg-white p-3 pl-8 rounded-xl focus:ring-2 ring-indigo-500 outline-none transition-all font-medium text-slate-900" 
                            placeholder="Optional amount per period" 
                            value={periodic} 
                            onChange={e => setPeriodic(e.target.value)} 
                        />
                        <span className="absolute right-3 top-3.5 text-xs font-medium text-indigo-400 bg-indigo-50 px-2">Optional</span>
                    </div>
                    <p className="text-[10px] text-indigo-400 mt-2 leading-relaxed">
                        Set a recurring target to stay on track (e.g. ฿500 per week).
                    </p>
                 </div>
              </div>

              <button type="submit" className="w-full mt-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]">
                  {editingGoalId ? 'Save Changes' : 'Create Goal'}
              </button>
           </form>
        )}

        {goals.length === 0 && !isAdding && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <div className="bg-white p-6 rounded-full mb-6 shadow-sm border border-slate-100">
                    <Trophy className="w-16 h-16 text-indigo-200" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">No Goals Yet</h3>
                <p className="max-w-[280px] text-center text-sm mb-8 leading-relaxed text-slate-500">
                    Start saving for your dreams today. Set a target amount and track your progress over time.
                </p>
                <button 
                    onClick={() => { setIsAdding(true); setEditingGoalId(null); }}
                    className="bg-indigo-600 text-white px-8 py-4 rounded-full font-bold shadow-xl shadow-indigo-200 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" /> Create Your First Goal
                </button>
            </div>
        )}

        <div className="space-y-4">
           {goals.map(goal => {
               const progress = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
               const isCompleted = goal.currentAmount >= goal.targetAmount && goal.targetAmount > 0;

               return (
                   <div key={goal.id} className={`bg-white p-5 rounded-2xl shadow-sm border relative overflow-hidden transition-all ${isCompleted ? 'border-green-200 bg-green-50/30' : 'border-slate-100 hover:border-indigo-100'}`}>
                       {isCompleted && (
                           <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1">
                               <CheckCircle2 className="w-3 h-3" /> DONE
                           </div>
                       )}
                       
                       <div className="flex justify-between items-start mb-2">
                           <div>
                               <h3 className="font-bold text-lg text-slate-800">{goal.title}</h3>
                               {goal.periodicTarget ? (
                                   <div className="flex items-center gap-1.5 mt-1">
                                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">TARGET</span>
                                      <p className="text-xs text-slate-500">฿{goal.periodicTarget.toLocaleString()} / period</p>
                                   </div>
                               ) : null}
                           </div>
                           <div className="flex gap-1">
                             <button onClick={() => handleEdit(goal)} className="text-slate-300 hover:text-indigo-600 p-2 hover:bg-indigo-50 rounded-full transition-colors"><Edit2 className="w-4 h-4" /></button>
                             <button onClick={() => deleteGoal(goal.id)} className="text-slate-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-colors"><Trash2 className="w-4 h-4" /></button>
                           </div>
                       </div>

                       <div className="flex items-baseline gap-1 mb-3 mt-2">
                           <span className={`text-3xl font-bold tracking-tight ${isCompleted ? 'text-green-600' : 'text-indigo-600'}`}>฿{goal.currentAmount.toLocaleString()}</span>
                           <span className="text-sm text-slate-400 font-medium">of ฿{goal.targetAmount.toLocaleString()}</span>
                       </div>

                       <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden mb-5">
                           <div className={`h-full transition-all duration-1000 relative ${isCompleted ? 'bg-green-500' : 'bg-indigo-500'}`} style={{ width: `${progress}%` }}>
                                <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                           </div>
                       </div>

                       {depositGoalId === goal.id ? (
                           <div className="flex flex-col gap-3 animate-in fade-in bg-slate-50 p-4 rounded-xl border border-slate-200">
                               <div className="flex gap-2">
                                   <div className="relative flex-1">
                                       <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">฿</span>
                                       <input 
                                         type="number" 
                                         autoFocus 
                                         placeholder="Amount" 
                                         className="w-full border-0 bg-white rounded-lg pl-7 pr-3 py-2 text-sm font-bold shadow-sm focus:ring-2 ring-indigo-500 outline-none"
                                         value={depositAmount}
                                         onChange={e => setDepositAmount(e.target.value)}
                                       />
                                   </div>
                                   <div className="flex-1">
                                      <select 
                                        value={depositSourceId}
                                        onChange={e => setDepositSourceId(e.target.value)}
                                        className="w-full h-full border-0 bg-white rounded-lg px-3 py-2 text-sm font-medium shadow-sm focus:ring-2 ring-indigo-500 outline-none text-slate-700"
                                      >
                                          <option value="" disabled>Select Source</option>
                                          {sources.map(s => (
                                              <option key={s.id} value={s.id}>{s.name} (฿{s.balance.toLocaleString()})</option>
                                          ))}
                                      </select>
                                   </div>
                               </div>
                               <div className="flex justify-end gap-2">
                                   <button onClick={() => setDepositGoalId(null)} className="text-slate-500 px-3 py-1.5 hover:bg-slate-200 rounded-lg text-sm font-medium">Cancel</button>
                                   <button onClick={() => handleDeposit(goal.id)} className="bg-indigo-600 text-white px-6 py-1.5 rounded-lg font-bold text-sm shadow-sm hover:bg-indigo-700">Add Savings</button>
                               </div>
                           </div>
                       ) : (
                           <button 
                             onClick={() => openDeposit(goal.id)} 
                             disabled={isCompleted}
                             className="w-full py-3 flex items-center justify-center gap-2 bg-slate-50 hover:bg-indigo-50 text-indigo-700 rounded-xl font-bold text-sm transition-colors border border-slate-100 hover:border-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                           >
                               <Coins className="w-4 h-4" /> {isCompleted ? 'Goal Reached' : 'Add Savings'}
                           </button>
                       )}
                   </div>
               );
           })}
        </div>

        {!isAdding && goals.length > 0 && (
            <button 
                onClick={() => { setIsAdding(true); setEditingGoalId(null); setTitle(''); setTarget(''); setCurrent(''); setPeriodic(''); }}
                className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-xl shadow-indigo-300 flex items-center justify-center hover:scale-110 transition-transform z-30"
            >
                <Plus className="w-6 h-6" />
            </button>
        )}

        {/* Celebration Modal */}
        {celebratedGoal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                     <div className="text-7xl mb-6 animate-bounce">🏆</div>
                     <h2 className="text-3xl font-bold text-indigo-900 mb-3">Congratulations!</h2>
                     <p className="text-slate-600 mb-8 leading-relaxed">
                        You've reached your savings goal for <br/>
                        <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 text-xl block mt-2">{celebratedGoal}</span>
                     </p>
                     <button onClick={() => setCelebratedGoal(null)} className="bg-indigo-600 text-white px-6 py-4 rounded-2xl font-bold shadow-xl shadow-indigo-200 hover:scale-105 transition-transform w-full text-lg">
                        Awesome!
                     </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
