"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "@/firebase/client"
import LoadingSpinner  from "./loading-spinner"

type UserRole = "super_admin" | "moderator" | "municipal_rep" | "citizen" | null

interface UserData {
  uid: string
  email: string | null
  displayName: string | null
  role: UserRole
  isActive: boolean
  photoURL: string | null
  createdAt: Date | null
  lastLogin: Date | null
}

interface AuthContextType {
  user: User | null
  userData: UserData | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)

      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid)
          const userDoc = await getDoc(userDocRef)

          if (userDoc.exists()) {
            const data = userDoc.data()
            setUserData({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              role: data.role,
              isActive: data.isActive,
              createdAt: data.createdAt?.toDate() || null,
              lastLogin: data.lastLogin?.toDate() || null,
            })
          } else {
            // User document doesn't exist in Firestore
            setUserData(null)
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
          setUserData(null)
        }
      } else {
        setUserData(null)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return <LoadingSpinner />
  }

  return <AuthContext.Provider value={{ user, userData, loading }}>{children}</AuthContext.Provider>
}
