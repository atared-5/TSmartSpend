import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useBudget } from '../context/BudgetContext';
import { SpendingChart } from '../components/Charts';
import { ArrowLeft, Edit2, Check, X, Wallet, AlertCircle, Loader2, FileSpreadsheet, Trash2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import ExcelJS from 'exceljs';

export const AccountDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { sources, transactions, categories, updateSource, updateTransaction, deleteTransaction } = useBudget();
  
  const source = sources.find(s => s.id === id);
  const highlightedTxId = (location.state as any)?.highlightedTxId;
  
  // Filter transactions for this source and sort by date descending (newest first)
  const sourceTransactions = transactions
    .filter(t => t.sourceId === id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBalance, setEditBalance] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Transaction Editing State
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [editTxAmount, setEditTxAmount] = useState('');
  const [editTxNote, setEditTxNote] = useState('');
  const [editTxSourceId, setEditTxSourceId] = useState('');

  // Scroll to highlighted transaction if it exists
  useEffect(() => {
      if (highlightedTxId) {
          const element = document.getElementById(`tx-${highlightedTxId}`);
          if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
      }
  }, [highlightedTxId]);

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
    setEditTxSourceId(tx.sourceId);
  };

  const saveTxEdit = (txId: string) => {
    updateTransaction(txId, {
        amount: parseFloat(editTxAmount),
        note: editTxNote,
        sourceId: editTxSourceId
    });
    setEditingTxId(null);
  };

  const handleDeleteTx = (txId: string) => {
      if (window.confirm("Are you sure you want to delete this transaction? This will update your account balance.")) {
          deleteTransaction(txId);
      }
  };

  const downloadReport = async () => {
    setIsExporting(true);
    try {
        // 1. Capture the Chart Image
        const chartNode = document.getElementById('account-chart-capture');
        let chartImageBase64 = '';
        if (chartNode) {
            await new Promise(r => setTimeout(r, 100));
            chartImageBase64 = await toPng(chartNode, { backgroundColor: '#ffffff' });
        }

        // 2. Init Workbook
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet(source.name);
        
        sheet.columns = [
          { header: 'Date', key: 'date', width: 15 },
          { header: 'Time', key: 'time', width: 10 },
          { header: 'Category', key: 'category', width: 20 },
          { header: 'Note', key: 'note', width: 30 },
          { header: 'Amount', key: 'amount', width: 15 },
          { header: 'Type', key: 'type', width: 10 },
        ];

        sheet.insertRow(1, [`Account Report: ${source.name}`]);
        sheet.insertRow(2, [`Generated on: ${new Date().toLocaleDateString()}`]);
        sheet.insertRow(3, [`Current Balance: ${source.balance.toLocaleString()}`]);
        sheet.insertRow(4, ['']); 

        sheet.getRow(1).font = { bold: true, size: 14 };
        sheet.getRow(3).font = { bold: true };

        let currentRowIndex = 5;

        if (chartImageBase64) {
             const base64Data = chartImageBase64.split(',')[1];
             const imageId = workbook.addImage({
                 base64: base64Data,
                 extension: 'png',
             });
             
             sheet.addImage(imageId, {
                 tl: { col: 0.5, row: currentRowIndex - 1 },
                 br: { col: 5.5, row: currentRowIndex + 19 }
             });

             currentRowIndex += 21; 
        }

        const monthKeys = (Array.from(new Set(sourceTransactions.map(t => {
            const d = new Date(t.date);
            return `${d.getMonth()}-${d.getFullYear()}`;
        }))) as string[]).sort((a, b) => {
            const [m1, y1] = a.split('-').map(Number);
            const [m2, y2] = b.split('-').map(Number);
            return new Date(y2, m2).getTime() - new Date(y1, m1).getTime();
        });

        for (const key of monthKeys) {
            const [month, year] = key.split('-').map(Number);
            const dateObj = new Date(year, month);
            const monthLabel = dateObj.toLocaleDateString('default', { month: 'long', year: 'numeric' });
            
            const monthlyTxs = sourceTransactions.filter(t => {
                const d = new Date(t.date);
                return d.getMonth() === month && d.getFullYear() === year;
            });

            const headerRow = sheet.getRow(currentRowIndex);
            headerRow.values = [monthLabel];
            headerRow.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF4F46E5' } 
            };
            currentRowIndex++;

            sheet.getRow(currentRowIndex).values = ['Category Summary', 'Amount Spent'];
            sheet.getRow(currentRowIndex).font = { bold: true, italic: true };
            currentRowIndex++;

            categories.forEach(cat => {
                const total = monthlyTxs
                    .filter(t => t.categoryId === cat.id && t.type === 'EXPENSE')
                    .reduce((acc, t) => acc + t.amount, 0);
                
                if (total > 0) {
                    sheet.getRow(currentRowIndex).values = [`${cat.icon} ${cat.name}`, total];
                    currentRowIndex++;
                }
            });

            currentRowIndex++; 

            const txHeaderRow = sheet.getRow(currentRowIndex);
            txHeaderRow.values = ['Date', 'Time', 'Category', 'Note', 'Amount', 'Type'];
            txHeaderRow.font = { bold: true };
            txHeaderRow.border = { bottom: { style: 'thin' } };
            currentRowIndex++;

            monthlyTxs.forEach(t => {
                const d = new Date(t.date);
                const catName = categories.find(c => c.id === t.categoryId)?.name || 'Unknown';
                
                const row = sheet.getRow(currentRowIndex);
                row.values = [
                    d.toLocaleDateString(),
                    d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                    catName,
                    t.note || '',
                    t.amount,
                    t.type
                ];

                const amountCell = row.getCell(5);
                if (t.type === 'INCOME') {
                     amountCell.font = { color: { argb: 'FF16A34A' } }; 
                }
                
                currentRowIndex++;
            });

            currentRowIndex++; 
            currentRowIndex++; 
        }

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${source.name.replace(/\s+/g, '_')}_Report.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } catch (err) {
        console.error("Export failed", err);
        alert("Failed to generate report. Please try again.");
    } finally {
        setIsExporting(false);
    }
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
            <div className="flex gap-2">
                <button 
                    onClick={downloadReport} 
                    disabled={isExporting}
                    className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-full text-white backdrop-blur-md transition-all disabled:opacity-50" 
                    title="Download Excel / Google Sheets File"
                >
                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                    <span className="text-xs font-bold">Export</span>
                </button>
                {!isEditing && (
                <button onClick={startEdit} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                    <Edit2 className="w-5 h-5" />
                </button>
                )}
            </div>
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
        <section id="account-chart-capture" className="bg-white rounded-2xl overflow-hidden">
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
                const isHighlighted = highlightedTxId === tx.id;

                return (
                  <div 
                    key={tx.id} 
                    id={`tx-${tx.id}`}
                    className={`bg-white p-4 rounded-xl border shadow-sm flex items-center justify-between group transition-all duration-500 ${isHighlighted ? 'ring-2 ring-indigo-500 animate-pulse' : 'border-slate-100'}`}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="text-2xl bg-slate-50 w-10 h-10 flex items-center justify-center rounded-full shrink-0">
                        {category?.icon || '💸'}
                      </div>
                      
                      {isTxEditing ? (
                        <div className="flex-1 space-y-2 pr-2 animate-in fade-in">
                           <div className="flex gap-2">
                               <input 
                                  type="number" 
                                  value={editTxAmount} 
                                  onChange={e => setEditTxAmount(e.target.value)}
                                  className="flex-1 border rounded p-1 text-sm font-bold"
                                  autoFocus
                               />
                               <select 
                                  value={editTxSourceId}
                                  onChange={e => setEditTxSourceId(e.target.value)}
                                  className="text-xs border rounded p-1 bg-white"
                               >
                                  {sources.map(s => (
                                      <option key={s.id} value={s.id}>{s.name}</option>
                                  ))}
                               </select>
                           </div>
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
                           <div className="flex flex-col gap-1">
                             <button onClick={() => saveTxEdit(tx.id)} className="bg-indigo-600 text-white p-2 rounded-lg shadow-sm">
                               <Check className="w-4 h-4" />
                             </button>
                             <button onClick={() => setEditingTxId(null)} className="text-slate-400 p-2 hover:bg-slate-50 rounded-lg">
                               <X className="w-4 h-4" />
                             </button>
                           </div>
                        ) : (
                           <div className="flex items-center gap-3">
                             <span className={`font-bold whitespace-nowrap ${tx.type === 'INCOME' ? 'text-green-600' : 'text-slate-900'}`}>
                               {tx.type === 'INCOME' ? '+' : '-'} ฿{tx.amount.toLocaleString()}
                             </span>
                             <div className="flex opacity-0 group-hover:opacity-100 transition-all">
                                <button onClick={() => startTxEdit(tx)} className="p-2 text-slate-300 hover:text-indigo-600">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDeleteTx(tx.id)} className="p-2 text-slate-300 hover:text-red-500">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                             </div>
                           </div>
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