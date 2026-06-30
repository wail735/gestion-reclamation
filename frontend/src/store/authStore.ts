import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  role: 'admin' | 'user';
  adresse?: string;
  phone?: string;
  token: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => {
        set({ user: null, isAuthenticated: false });
        // Optional: Call backend logout
        if (localStorage.getItem('auth-storage')) {
           const parsed = JSON.parse(localStorage.getItem('auth-storage') || '{}');
           const token = parsed?.state?.user?.token;
           if(token) {
               fetch('http://localhost:5000/api/auth/logout', {
                   method: 'POST',
                   headers: {
                       'Authorization': `Bearer ${token}`
                   }
               }).catch(console.error);
           }
        }
      },
      updateUser: (data) => set((state) => ({
        user: state.user ? { ...state.user, ...data } : null
      })),
    }),
    {
      name: 'auth-storage',
    }
  )
);
