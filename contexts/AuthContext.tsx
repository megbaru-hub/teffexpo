import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authApi, ApiError } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'merchant';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  merchantLogin: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<void>;
  merchantRegister: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const userData: any = await authApi.getMe();
        // Convert _id to id if needed
        if (userData && userData._id && !userData.id) {
          userData.id = userData._id.toString();
        }
        setUser(userData as User);
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string): Promise<User> => {
    try {
      const response: any = await authApi.login(email, password);
      localStorage.setItem('token', response.token);
      const userData = response.data;
      setUser(userData);
      return userData;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error('Login failed');
    }
  };

  const merchantLogin = async (email: string, password: string): Promise<User> => {
    try {
      const response: any = await authApi.merchantLogin(email, password);
      localStorage.setItem('token', response.token);
      const userData = response.data;
      setUser(userData);
      return userData;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error('Login failed');
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response: any = await authApi.register(name, email, password);
      localStorage.setItem('token', response.token);
      setUser(response.data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error('Registration failed');
    }
  };

  const merchantRegister = async (name: string, email: string, password: string) => {
    try {
      const response: any = await authApi.merchantRegister(name, email, password);
      localStorage.setItem('token', response.token);
      setUser(response.data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error('Registration failed');
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.removeItem('token');
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    merchantLogin,
    register,
    merchantRegister,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

