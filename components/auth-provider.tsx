"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { auth, db } from "@/firebase/client"
import { LoadingSpinner } from "./loading-spinner"
import { useAuthState } from "react-firebase-hooks/auth"

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
  error: Error | null
}

const defaultUserData: UserData = {
  uid: '',
  email: null,
  displayName: null,
  role: null,
  isActive: false,
  photoURL: null,
  createdAt: null,
  lastLogin: null,
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  error: null,
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, loading, error] = useAuthState(auth)
  const [userData, setUserData] = useState<UserData | null>(null)

  useEffect(() => {
    const handleUserData = async (currentUser: User | null) => {
      if (currentUser) {
        try {
          const userDocRef = doc(db, "users", currentUser.uid)
          const userDoc = await getDoc(userDocRef)

          if (userDoc.exists()) {
            const data = userDoc.data()
            setUserData({
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              role: data.role || null,
              isActive: data.isActive ?? false,
              createdAt: data.createdAt?.toDate() || null,
              lastLogin: data.lastLogin?.toDate() || null,
            })
          } else {
            // Create new user document if it doesn't exist
            const newUserData = {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              role: 'citizen' as UserRole,
              isActive: true,
              createdAt: new Date(),
              lastLogin: new Date(),
            }
            
            await setDoc(userDocRef, newUserData)
            setUserData(newUserData)
          }
        } catch (error) {
          console.error("Error handling user data:", error)
          setUserData(null)
        }
      } else {
        setUserData(null)
      }
    }

    if (user !== undefined) {
      handleUserData(user)
    }
  }, [user])

  if (loading) {
    return <LoadingSpinner text="Chargement de l'authentification..." />
  }

  return (
    <AuthContext.Provider value={{ user: user || null, userData, loading, error: error || null }}>
      {children}
    </AuthContext.Provider>
  )
}
