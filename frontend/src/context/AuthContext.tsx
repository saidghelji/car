import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface AuthContextType {
  user: any | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  updateUsername: (newUsername: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser) setUser(JSON.parse(storedUser));
    if (storedToken) {
      setToken(storedToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
  }, []);

  const login = async (username: string, password: string) => {
    try {
      // Use Vite env base if available
      const API_BASE = (import.meta.env as any).VITE_API_BASE || 'http://localhost:5000';
      const response = await axios.post(`${API_BASE}/api/users/login`, { username, password });

      // Backend may return either { user, token } or { id, username, role, token }
      const resp = response.data || {};
      let userData = resp.user;
      const jwt = resp.token;

      if (!userData && resp.id) {
        userData = { id: resp.id, username: resp.username, role: resp.role };
      }

      setUser(userData ?? null);
      setToken(jwt ?? null);
      if (userData) localStorage.setItem('user', JSON.stringify(userData));
      if (jwt) localStorage.setItem('token', jwt);
      if (jwt) axios.defaults.headers.common['Authorization'] = `Bearer ${jwt}`;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const logout = () => {
    setUser(null);
  setToken(null);
  delete axios.defaults.headers.common['Authorization'];
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    try {
  await axios.put('http://localhost:5000/api/users/change-password', { oldPassword, newPassword });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Password change failed');
    }
  };

  const updateUsername = async (newUsername: string) => {
    try {
  const response = await axios.put('http://localhost:5000/api/users/update-username', { username: newUsername });
  const updatedUser = { ...user, username: response.data.username };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Username update failed');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, changePassword, updateUsername }}>
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
