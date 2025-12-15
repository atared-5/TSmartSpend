import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  hasAccount: boolean; // To know if we should show Login or Register
  user: string | null;
  login: (username: string, password: string) => boolean;
  register: (username: string, password: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_KEY = 'smartspend_auth_creds';
const SESSION_KEY = 'smartspend_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasAccount, setHasAccount] = useState(false);
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    // Check if an account exists
    const storedCreds = localStorage.getItem(AUTH_KEY);
    if (storedCreds) {
      setHasAccount(true);
    }

    // Check if user is already logged in (Session persistence)
    const session = localStorage.getItem(SESSION_KEY);
    if (session && storedCreds) {
      const { username } = JSON.parse(storedCreds);
      if (session === username) {
        setIsAuthenticated(true);
        setUser(username);
      }
    }
  }, []);

  const register = (username: string, password: string) => {
    // In a real app, never store passwords in plain text. 
    // For this client-side app, we store it here to validate against the input.
    // We are essentially using the device's storage as the database.
    const creds = { username, password };
    localStorage.setItem(AUTH_KEY, JSON.stringify(creds));
    
    // Auto login after register
    localStorage.setItem(SESSION_KEY, username);
    setHasAccount(true);
    setIsAuthenticated(true);
    setUser(username);
  };

  const login = (username: string, password: string) => {
    const storedCreds = localStorage.getItem(AUTH_KEY);
    if (!storedCreds) return false;

    const creds = JSON.parse(storedCreds);
    if (username === creds.username && password === creds.password) {
      localStorage.setItem(SESSION_KEY, username);
      setIsAuthenticated(true);
      setUser(username);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, hasAccount, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
