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

interface AuthProviderProps {
  children: ReactNode
  initialUser?: User | null
}

export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const isTesting = initialUser !== undefined
  const [user, setUser] = useState<User | null>(isTesting ? initialUser : null)
  const [session, setSession] = useState<Session | null>(
    isTesting && initialUser ? ({ access_token: "test_token", user: initialUser } as unknown as Session) : null
  )
  const [loading, setLoading] = useState(!isTesting)

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
    await signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isAuthenticated: Boolean(user),
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
