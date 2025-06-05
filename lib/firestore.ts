import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore"
import { db } from "@/firebase/client"
import type { Comment, Like } from "@/lib/types"

// Comments
export async function addComment(data: {
  toiletId: string
  userId: string
  userName: string
  content: string
  rating: number
}) {
  const docRef = await addDoc(collection(db, "comments"), {
    ...data,
    createdAt: serverTimestamp(),
  })

  // Update toilet rating
  await updateToiletRating(data.toiletId)

  return {
    id: docRef.id,
    ...data,
    createdAt: new Date().toISOString(),
  }
}

export async function getComments(toiletId: string): Promise<Comment[]> {
  const q = query(collection(db, "comments"), where("toiletId", "==", toiletId), orderBy("createdAt", "desc"))

  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
  })) as Comment[]
}

// Likes
export async function addLike(data: {
  toiletId: string
  userId: string
  type: "like" | "dislike"
}) {
  // Check if user already liked/disliked
  const existingQuery = query(
    collection(db, "likes"),
    where("toiletId", "==", data.toiletId),
    where("userId", "==", data.userId),
  )

  const existingDocs = await getDocs(existingQuery)

  // Remove existing like/dislike
  for (const doc of existingDocs.docs) {
    await deleteDoc(doc.ref)
  }

  const docRef = await addDoc(collection(db, "likes"), {
    ...data,
    createdAt: serverTimestamp(),
  })

  return {
    id: docRef.id,
    ...data,
    createdAt: new Date().toISOString(),
  }
}

export async function getLikes(toiletId: string): Promise<Like[]> {
  const q = query(collection(db, "likes"), where("toiletId", "==", toiletId))

  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
  })) as any
}

export async function removeLike(toiletId: string, userId: string) {
  const q = query(collection(db, "likes"), where("toiletId", "==", toiletId), where("userId", "==", userId))

  const querySnapshot = await getDocs(q)
  for (const doc of querySnapshot.docs) {
    await deleteDoc(doc.ref)
  }
}

// Update toilet rating based on comments
async function updateToiletRating(toiletId: string) {
  const comments = await getComments(toiletId)
  if (comments.length > 0) {
    const averageRating = comments.reduce((sum, comment) => sum + comment.rating, 0) / comments.length

    // Update toilet document (assuming you have a toilets collection)
    const toiletRef = doc(db, "toilets", toiletId)
    await updateDoc(toiletRef, {
      rating: averageRating,
      reviewCount: comments.length,
    })
  }
}
