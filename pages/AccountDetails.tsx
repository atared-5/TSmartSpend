import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBudget } from '../context/BudgetContext';
import { SpendingChart } from '../components/Charts';
import { ArrowLeft, Edit2, Check, X, Wallet, AlertCircle, Save } from 'lucide-react';

export const AccountDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { sources, transactions, categories, updateSource, updateTransaction } = useBudget();
  
  const source = sources.find(s => s.id === id);
  
  // Filter transactions for this source and sort by date descending (newest first)
  const sourceTransactions = transactions
    .filter(t => t.sourceId === id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBalance, setEditBalance] = useState('');

  // Transaction Editing State
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [editTxAmount, setEditTxAmount] = useState('');
  const [editTxNote, setEditTxNote] = useState('');

  if (!source) {
    return <div className="p-6 text-center text-slate-500">Account not found</div>;
  }

  const startEdit = () => {
    setEditName(source.name);
    setEditBalance(source.balance.toString());
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
  };

  const saveEdit = () => {
    if (window.confirm("Are you sure you want to update this account's details?")) {
      updateSource(source.id, {
        name: editName,
        balance: parseFloat(editBalance)
      });
      setIsEditing(false);
    }
  };

  // Transaction Editing Helpers
  const startTxEdit = (tx: any) => {
    setEditingTxId(tx.id);
    setEditTxAmount(tx.amount.toString());
    setEditTxNote(tx.note || '');
  };

  const saveTxEdit = (id: string) => {
    updateTransaction(id, {
        amount: parseFloat(editTxAmount),
        note: editTxNote
    });
    setEditingTxId(null);
  };

  return (
    <div className="pb-24">
      {/* Header */}
      <header className={`${source.color} text-white p-6 pb-12 rounded-b-[2.5rem] shadow-xl relative overflow-hidden transition-colors duration-500`}>
        <div className="absolute top-0 right-0 p-8 opacity-10">
           <Wallet className="w-32 h-32" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => navigate('/')} className="p-2 -ml-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            {!isEditing && (
              <button onClick={startEdit} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                <Edit2 className="w-5 h-5" />
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-3 bg-white/10 p-4 rounded-xl backdrop-blur-sm animate-in fade-in zoom-in-95">
              <div>
                <label className="text-xs text-indigo-200 uppercase font-bold tracking-wider">Account Name</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-transparent border-b border-indigo-300 py-1 text-white font-bold outline-none focus:border-white text-lg"
                />
              </div>
              <div>
                <label className="text-xs text-indigo-200 uppercase font-bold tracking-wider">Balance</label>
                <input 
                  type="number" 
                  value={editBalance}
                  onChange={(e) => setEditBalance(e.target.value)}
                  className="w-full bg-transparent border-b border-indigo-300 py-1 text-white font-bold outline-none focus:border-white text-2xl"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={saveEdit} className="flex-1 bg-white text-indigo-600 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" /> Save
                </button>
                <button onClick={cancelEdit} className="flex-1 bg-indigo-800 text-white py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2">
                  <X className="w-4 h-4" /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h1 className="text-3xl font-bold mb-1">{source.name}</h1>
              <p className="text-indigo-200 text-sm font-medium uppercase tracking-widest mb-4">{source.type}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl opacity-80">฿</span>
                <span className="text-5xl font-bold tracking-tight">{source.balance.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="px-4 -mt-8 relative z-20 space-y-6">
        {/* Chart */}
        <section>
          <SpendingChart customTransactions={sourceTransactions} />
        </section>

        {/* Transactions List */}
        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-3 px-1">History</h2>
          {sourceTransactions.length > 0 ? (
            <div className="space-y-3">
              {sourceTransactions.map(tx => {
                const category = categories.find(c => c.id === tx.categoryId);
                const isTxEditing = editingTxId === tx.id;

                return (
                  <div key={tx.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="text-2xl bg-slate-50 w-10 h-10 flex items-center justify-center rounded-full shrink-0">
                        {category?.icon || '💸'}
                      </div>
                      
                      {isTxEditing ? (
                        <div className="flex-1 space-y-2 pr-2">
                           <input 
                              type="number" 
                              value={editTxAmount} 
                              onChange={e => setEditTxAmount(e.target.value)}
                              className="w-full border rounded p-1 text-sm font-bold"
                           />
                           <input 
                              type="text" 
                              value={editTxNote} 
                              onChange={e => setEditTxNote(e.target.value)}
                              className="w-full border rounded p-1 text-xs text-slate-600"
                              placeholder="Note"
                           />
                        </div>
                      ) : (
                        <div className="min-w-0">
                           <p className="font-bold text-slate-900 truncate">{category?.name}</p>
                           {tx.note && <p className="text-xs text-slate-500 truncate">{tx.note}</p>}
                           <p className="text-[10px] text-slate-400 mt-1">
                              {new Date(tx.date).toLocaleDateString()} • {new Date(tx.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                           </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pl-2">
                        {isTxEditing ? (
                           <>
                             <button onClick={() => saveTxEdit(tx.id)} className="bg-indigo-600 text-white p-1 rounded"><Check className="w-4 h-4" /></button>
                             <button onClick={() => setEditingTxId(null)} className="text-slate-400 p-1"><X className="w-4 h-4" /></button>
                           </>
                        ) : (
                           <>
                             <span className={`font-bold whitespace-nowrap ${tx.amount > 0 ? 'text-slate-900' : 'text-green-600'}`}>
                               {tx.amount < 0 ? '+' : '-'} ฿{Math.abs(tx.amount).toLocaleString()}
                             </span>
                             <button onClick={() => startTxEdit(tx)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-indigo-600 transition-all">
                                <Edit2 className="w-4 h-4" />
                             </button>
                           </>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
             <div className="bg-white p-8 rounded-xl border border-slate-100 text-center text-slate-400">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No transactions for this account yet.</p>
             </div>
          )}
        </section>
      </div>
    </div>
  );
};
