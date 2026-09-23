import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import type { Session, User } from "@supabase/supabase-js"

import {
  getAccessToken,
  resetPasswordForEmail,
  signInWithGoogle,
  signInWithPassword,
  signOut,
  signUpWithPassword,
  supabase,
} from "@/lib/supabase"

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isAuthenticated: boolean
  isGuest: boolean
  continueAsGuest: () => void
  exitGuestMode: () => void
  signInWithGoogle: () => Promise<void>
  signInWithPassword: (email: string, password: string) => Promise<void>
  signUpWithPassword: (
    email: string,
    password: string,
    fullName?: string
  ) => Promise<void>
  resetPasswordForEmail: (email: string) => Promise<void>
  signOut: () => Promise<void>
  getAccessToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const GUEST_STORAGE_KEY = "duichinese_guest_mode"

interface AuthProviderProps {
  children: ReactNode
  initialUser?: User | null
  initialIsGuest?: boolean
}

export function AuthProvider({ children, initialUser, initialIsGuest }: AuthProviderProps) {
  const isTesting = initialUser !== undefined
  const [user, setUser] = useState<User | null>(isTesting ? initialUser : null)
  const [session, setSession] = useState<Session | null>(
    isTesting && initialUser ? ({ access_token: "test_token", user: initialUser } as unknown as Session) : null
  )
  const [loading, setLoading] = useState(!isTesting)
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    if (initialIsGuest !== undefined) return initialIsGuest
    try {
      return localStorage.getItem(GUEST_STORAGE_KEY) === "true"
    } catch {
      return false
    }
  })

  // Clear guest mode whenever an authenticated user signs in
  useEffect(() => {
    if (user) {
      setIsGuest(false)
      try {
        localStorage.removeItem(GUEST_STORAGE_KEY)
      } catch {
        // ignore
      }
    }
  }, [user])

  const continueAsGuest = () => {
    setIsGuest(true)
    try {
      localStorage.setItem(GUEST_STORAGE_KEY, "true")
    } catch {
      // ignore
    }
  }

  const exitGuestMode = () => {
    setIsGuest(false)
    try {
      localStorage.removeItem(GUEST_STORAGE_KEY)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (isTesting) {
      setLoading(false)
      return
    }

    // 1. Check active session on mount
    void supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // 2. Listen to real-time auth changes (sign in, sign out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [isTesting])

  const handleSignInWithGoogle = async () => {
    await signInWithGoogle()
  }

  const handleSignInWithPassword = async (email: string, password: string) => {
    await signInWithPassword(email, password)
  }

  const handleSignUpWithPassword = async (
    email: string,
    password: string,
    fullName?: string
  ) => {
    await signUpWithPassword(email, password, fullName)
  }

  const handleResetPassword = async (email: string) => {
    await resetPasswordForEmail(email)
  }

  const handleSignOut = async () => {
    exitGuestMode()
    await signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isAuthenticated: Boolean(user),
        isGuest,
        continueAsGuest,
        exitGuestMode,
        signInWithGoogle: handleSignInWithGoogle,
        signInWithPassword: handleSignInWithPassword,
        signUpWithPassword: handleSignUpWithPassword,
        resetPasswordForEmail: handleResetPassword,
        signOut: handleSignOut,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
