import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Wallet, ArrowRight, Lock, User, Eye, EyeOff } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, register, hasAccount } = useAuth();
  const [isRegistering, setIsRegistering] = useState(!hasAccount);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // If the user manually toggles to register but an account exists, warn them
  // or simple logic: if account exists, default to login.
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (isRegistering) {
        // Registration Mode
        if (hasAccount) {
            // Logic for overriding existing account could go here, 
            // but for safety, let's just warn or allow overwrite.
            if (!window.confirm("An account already exists on this device. Overwrite it? All previous data will be accessible with the new password.")) {
                return;
            }
        }
        register(username, password);
    } else {
        // Login Mode
        const success = login(username, password);
        if (!success) {
            setError('Invalid username or password');
        }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-xl border border-slate-100">
        <div className="text-center mb-8">
          <div className="bg-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">SmartSpend</h1>
          <p className="text-slate-500 mt-2 text-sm">
            {isRegistering 
              ? "Create a secure passcode for your data." 
              : "Welcome back! Please sign in."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Username</label>
            <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 focus:ring-2 ring-indigo-500 outline-none transition-all font-medium"
                    placeholder="Enter your username"
                />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Password</label>
            <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-3 focus:ring-2 ring-indigo-500 outline-none transition-all font-medium"
                    placeholder="••••••••"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-500 text-sm rounded-lg font-medium text-center animate-pulse">
                {error}
            </div>
          )}

          <button 
            type="submit" 
            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
          >
            {isRegistering ? 'Create Account' : 'Sign In'} <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="mt-6 text-center">
            {hasAccount ? (
                <button 
                    onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
                    className="text-sm text-slate-400 hover:text-indigo-600 font-medium"
                >
                    {isRegistering 
                        ? "Already have an account? Log in" 
                        : "Reset / Create New Account"}
                </button>
            ) : (
                 <p className="text-xs text-slate-400 mt-4">
                    Your data is stored locally on this device. <br/>
                    Creating a login prevents unauthorized access.
                 </p>
            )}
        </div>
      </div>
    </div>
  );
};
