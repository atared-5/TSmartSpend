import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, NavLink, useLocation, Outlet } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { QuickAdd } from './pages/QuickAdd';
import { Budgets } from './pages/Budgets';
import { Goals } from './pages/Goals';
import { AccountDetails } from './pages/AccountDetails';
import { BudgetProvider } from './context/BudgetContext';
import { NotificationRequest } from './components/NotificationRequest';
import { Sidebar } from './components/Sidebar';
import { Home, PlusCircle } from 'lucide-react';

const Layout: React.FC = () => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Hide bottom nav on Quick Add page
  const showNav = location.pathname !== '/add';

  return (
    <div className="max-w-md mx-auto bg-slate-50 min-h-screen relative shadow-2xl overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="p-4 h-full overflow-y-auto scrollbar-hide">
        <Outlet context={{ toggleSidebar: () => setIsSidebarOpen(prev => !prev) }} />
      </main>

      {/* Floating Action Button for Mobile-First Primary Action */}
      {showNav && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-40">
           <NavLink 
              to="/add"
              className="bg-slate-900 text-white flex items-center gap-2 px-6 py-3 rounded-full shadow-xl shadow-slate-300 hover:scale-105 active:scale-95 transition-all"
           >
              <PlusCircle className="w-5 h-5" />
              <span className="font-semibold text-sm">Record Cash</span>
           </NavLink>
        </div>
      )}

      <NotificationRequest />
    </div>
  );
};

// Check for 9 PM notification logic (Simulated)
const NotificationChecker: React.FC = () => {
  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      // Check if it's 9 PM (21:00)
      if (now.getHours() === 21 && now.getMinutes() === 0) {
        if (Notification.permission === 'granted') {
          new Notification("Spending Report", {
            body: "It's 9 PM! Time to review your spending for today.",
            icon: '/vite.svg'
          });
        }
      }
    };

    // Check every minute
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return null;
};

const App: React.FC = () => {
  return (
    <BudgetProvider>
      <NotificationChecker />
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add" element={<QuickAdd />} />
            <Route path="/budgets/:period?" element={<Budgets />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/account/:id" element={<AccountDetails />} />
          </Route>
        </Routes>
      </HashRouter>
    </BudgetProvider>
  );
};

export default App;
