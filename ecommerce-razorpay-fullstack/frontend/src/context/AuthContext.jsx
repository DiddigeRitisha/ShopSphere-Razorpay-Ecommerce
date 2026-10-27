import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); const [loading, setLoading] = useState(true);
  useEffect(() => { if (localStorage.getItem('shopsphere_token')) api('/auth/me').then((d) => setUser(d.user)).catch(() => localStorage.removeItem('shopsphere_token')).finally(() => setLoading(false)); else setLoading(false); }, []);
  async function login(email, password) { const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }); localStorage.setItem('shopsphere_token', data.token); setUser(data.user); return data.user; }
  async function register(name, email, password) { const data = await api('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }); localStorage.setItem('shopsphere_token', data.token); setUser(data.user); return data.user; }
  function logout() { localStorage.removeItem('shopsphere_token'); setUser(null); }
  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
