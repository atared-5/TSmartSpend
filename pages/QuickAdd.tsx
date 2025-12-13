import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useBudget } from '../context/BudgetContext';
import { ArrowLeft, Calendar, Clock, Save, Plus } from 'lucide-react';
import { TransactionType } from '../types';

export const QuickAdd: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get('type'); // 'report' or 'cash' (default)
  
  const { categories, sources, addTransaction, addCategory } = useBudget();
  
  // Default to current time
  const now = new Date();
  const defaultDate = now.toISOString().split('T')[0];
  const defaultTime = now.toTimeString().slice(0, 5);

  const [amount, setAmount] = useState('-'); // Default to negative
  const [categoryId, setCategoryId] = useState('');
  
  const cashSource = sources.find(s => s.type === 'CASH');
  const initialSource = typeParam === 'report' ? (sources[0]?.id || '') : (cashSource?.id || '3');

  const [sourceId, setSourceId] = useState<string>(initialSource);
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(defaultTime);
  const [note, setNote] = useState('');

  // Category addition state
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('✨');

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow digits, minus at start, one dot
    if (/^-?\d*\.?\d*$/.test(val)) {
        setAmount(val);
    }
  };

  const handleAddCategory = () => {
    if (newCatName) {
        addCategory({
            name: newCatName,
            icon: newCatIcon,
            color: `#${Math.floor(Math.random()*16777215).toString(16)}`
        });
        setIsAddingCat(false);
        setNewCatName('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount === '-' || !categoryId || !sourceId) return;

    const val = parseFloat(amount);
    if (isNaN(val)) return;

    // Determine type based on sign
    const txType = val < 0 ? TransactionType.EXPENSE : TransactionType.INCOME;
    const finalAmount = Math.abs(val);

    // Combine date and time
    const combinedDate = new Date(`${date}T${time}`).toISOString();

    addTransaction({
      amount: finalAmount,
      categoryId,
      sourceId,
      date: combinedDate,
      note,
      type: txType
    });

    navigate('/');
  };

  const isExpense = amount.startsWith('-');
  const isValidAmount = amount !== '-' && amount !== '' && !isNaN(parseFloat(amount));

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-slate-100">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 text-slate-600">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-slate-900 ml-2">{typeParam === 'report' ? 'Add Report' : 'Record Cash'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        
        {/* Amount Input */}
        <div>
           <label className="block text-sm font-medium text-slate-500 mb-1">How much?</label>
           <div className="relative">
             <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-3xl font-bold ${isExpense ? 'text-red-400' : 'text-green-500'}`}>฿</span>
             <input 
               type="text" 
               inputMode="decimal"
               placeholder="-0.00"
               value={amount}
               onChange={handleAmountChange}
               className={`w-full pl-10 pr-4 py-4 text-4xl font-bold placeholder:text-slate-200 outline-none border-b-2 transition-colors ${isExpense ? 'text-red-500 border-red-100 focus:border-red-500' : 'text-green-600 border-green-100 focus:border-green-500'}`}
               autoFocus
               required
             />
           </div>
           <p className="text-xs text-slate-400 mt-1">
             {isExpense ? 'Negative means spending.' : 'Positive means income.'} Delete '-' for income.
           </p>
        </div>

        {/* Source Selection */}
        <div>
            <label className="block text-sm font-medium text-slate-500 mb-2">Paid from / Deposit to</label>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
                {sources.map(s => (
                    <button
                        key={s.id}
                        type="button"
                        onClick={() => setSourceId(s.id)}
                        className={`flex-shrink-0 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${sourceId === s.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                    >
                        {s.name}
                    </button>
                ))}
            </div>
        </div>

        {/* Categories Grid */}
        <div>
          <label className="block text-sm font-medium text-slate-500 mb-2">Category</label>
          <div className="grid grid-cols-3 gap-3">
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryId(cat.id)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${categoryId === cat.id ? 'bg-indigo-50 border-indigo-600 shadow-sm' : 'bg-white border-slate-100 hover:border-indigo-200'}`}
              >
                <span className="text-2xl mb-1">{cat.icon}</span>
                <span className={`text-xs font-medium ${categoryId === cat.id ? 'text-indigo-700' : 'text-slate-600'}`}>{cat.name}</span>
              </button>
            ))}
            
            {/* Add Category Button */}
            <button
               type="button"
               onClick={() => setIsAddingCat(true)}
               className="flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 transition-all"
            >
                <Plus className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-xs font-medium text-slate-500">Add New</span>
            </button>
          </div>
        </div>

        {/* Add Category Modal/Inline */}
        {isAddingCat && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-6 w-full max-w-sm animate-in fade-in zoom-in-95">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Add Category</h3>
                    <div className="flex gap-3 mb-4">
                        <input 
                           className="w-14 border rounded-lg p-2 text-center text-2xl" 
                           value={newCatIcon}
                           onChange={e => setNewCatIcon(e.target.value)}
                           maxLength={2}
                        />
                        <input 
                           className="flex-1 border rounded-lg p-2" 
                           placeholder="Name (e.g. Gym)"
                           value={newCatName}
                           onChange={e => setNewCatName(e.target.value)}
                           autoFocus
                        />
                    </div>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => setIsAddingCat(false)} className="flex-1 py-3 text-slate-500 font-medium">Cancel</button>
                        <button type="button" onClick={handleAddCategory} className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-bold">Add</button>
                    </div>
                </div>
            </div>
        )}

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-4">
           <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="date" 
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
           </div>
           <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="time" 
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
           </div>
        </div>

        {/* Note */}
        <div>
          <label className="block text-sm font-medium text-slate-500 mb-1">Note (Optional)</label>
          <textarea 
            placeholder="Bus fare, coffee, etc." 
            value={note}
            onChange={e => setNote(e.target.value)}
            className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none min-h-[80px]"
          />
        </div>

        {/* Submit */}
        <button 
          type="submit" 
          disabled={!isValidAmount || !categoryId}
          className={`w-full text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none ${isExpense ? 'bg-red-500 shadow-red-200' : 'bg-green-600 shadow-green-200'}`}
        >
          <Save className="w-5 h-5" /> {isExpense ? 'Record Expense' : 'Record Income'}
        </button>
      </form>
    </div>
  );
};