import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, WalletCards, X, ChevronDown, ChevronUp, Target, Bell } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const [isBudgetsOpen, setIsBudgetsOpen] = useState(false);

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Sidebar Panel */}
      <div className={`fixed top-0 left-0 h-full w-64 bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 flex items-center justify-between border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Menu</h2>
          <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="p-4 space-y-2 flex-1">
          <NavLink 
            to="/" 
            onClick={onClose}
            className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl transition-colors ${isActive ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </NavLink>
          
          {/* Collapsible Budgets */}
          <div>
            <button 
              onClick={() => setIsBudgetsOpen(!isBudgetsOpen)}
              className="w-full flex items-center justify-between p-3 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <WalletCards className="w-5 h-5" />
                <span>Budgets</span>
              </div>
              {isBudgetsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            <div className={`space-y-1 pl-11 overflow-hidden transition-all duration-300 ${isBudgetsOpen ? 'max-h-40 pt-1' : 'max-h-0'}`}>
              <NavLink 
                to="/budgets/weekly" 
                onClick={onClose}
                className={({ isActive }) => `block py-2 px-3 rounded-lg text-sm ${isActive ? 'text-indigo-700 font-medium bg-indigo-50' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Weekly Budgets
              </NavLink>
              <NavLink 
                to="/budgets/monthly" 
                onClick={onClose}
                className={({ isActive }) => `block py-2 px-3 rounded-lg text-sm ${isActive ? 'text-indigo-700 font-medium bg-indigo-50' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Monthly Budgets
              </NavLink>
            </div>
          </div>

          <NavLink 
            to="/goals" 
            onClick={onClose}
            className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl transition-colors ${isActive ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Target className="w-5 h-5" />
            Goals
          </NavLink>

          <NavLink 
            to="/reminders" 
            onClick={onClose}
            className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl transition-colors ${isActive ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Bell className="w-5 h-5" />
            Reminders
          </NavLink>
        </nav>
      </div>
    </>
  );
};
