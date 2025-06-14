import { create } from 'zustand'
import { User } from 'firebase/auth'

interface AuthState {
  user: User | null
  setUser: (user: User | null) => void
  isLoginForm: boolean
  toggleAuthForm: () => void
  isLoading: boolean
  setLoading: (isLoading: boolean) => void
  isAuthDialogOpen: boolean
  setAuthDialogOpen: (open: boolean) => void
  setIsLoginForm: (isLoginForm: boolean) => void
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  isLoginForm: true,
  toggleAuthForm: () => set((state) => ({ isLoginForm: !state.isLoginForm })),
  isLoading: false,
  setLoading: (isLoading) => set({ isLoading }),
  isAuthDialogOpen: false,
  setAuthDialogOpen: (isAuthDialogOpen) => set({ isAuthDialogOpen }),
  setIsLoginForm: (isLoginForm) => set({ isLoginForm }),
  logout: async () => {
    const { auth } = await import('@/firebase/client')
    await auth.signOut()
    set({ user: null })
  }
}))