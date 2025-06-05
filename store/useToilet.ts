import { useState, useEffect } from "react"
import { collection, query, orderBy, onSnapshot } from "firebase/firestore"
import type { Toilet } from "@/lib/types"
import { initializeFirestore } from "@/lib/toiletService"
import { db } from "@/firebase/client"

export function useToilets() {
  const [toilets, setToilets] = useState<Toilet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let unsubscribe: () => void;

    const loadToilets = async () => {
      try {
        setLoading(true)
        setError(null)

        // Initialize Firestore if empty
        await initializeFirestore()

        const toiletsRef = collection(db, "toilets")
        const q = query(toiletsRef, orderBy("rating", "desc"))

        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const toiletsData: Toilet[] = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            } as Toilet))
            setToilets(toiletsData)
            setLoading(false)
          },
          (error) => {
            console.error("Error loading toilets:", error)
            setError("Error loading toilets")
            setLoading(false)
          }
        )
      } catch (error) {
        console.error("Error setting up listener:", error)
        setError("Error connecting to database")
        setLoading(false)
      }
    }

    loadToilets()

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  return { toilets, loading, error }
}