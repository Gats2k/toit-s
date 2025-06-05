import { collection, addDoc, getDocs } from "firebase/firestore"
import type { Toilet } from "@/lib/types"
import { db } from "@/firebase/client"

const mockToilets: Omit<Toilet, "id">[] = [
  {
    name: "Toilettes Publiques Gare du Nord",
    address: "18 Rue de Dunkerque, 75010 Paris",
    latitude: 48.8809,
    longitude: 2.3553,
    status: "available",
    features: ["wheelchair_accessible", "baby_changing", "free"],
    rating: 4.2,
    addedBy: "system",
    addedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // ... autres toilettes
]

export const initializeFirestore = async () => {
  try {
    const toiletsRef = collection(db, "toilets")
    const snapshot = await getDocs(toiletsRef)

    if (snapshot.empty) {
      await Promise.all(
        mockToilets.map(async (mockToilet) => {
          await addDoc(toiletsRef, mockToilet)
        })
      )
      console.log("Firestore initialized with mock data")
      return true
    }
    return false
  } catch (error) {
    console.error("Error initializing Firestore:", error)
    throw error
  }
}