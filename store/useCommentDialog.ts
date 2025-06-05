"use client"

import { useState, useEffect } from "react"
import { create } from "zustand"
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  increment,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore"
import { useAuthState } from "react-firebase-hooks/auth"
import { useToast } from "@/hooks/use-toast"
import { auth, db } from "@/firebase/client"

interface Comment {
  id: string
  toiletId: string
  userId: string
  userEmail: string
  userName: string
  userAvatar?: string
  content: string
  rating: number
  createdAt: Date
  updatedAt: Date
  text?: string // For compatibility with existing code
}

interface CommentDialogState {
  isOpen: boolean
  selectedToiletId: string | null
  openDialog: (toiletId: string) => void
  closeDialog: () => void
}

const useCommentDialogStore = create<CommentDialogState>((set) => ({
  isOpen: false,
  selectedToiletId: null,
  openDialog: (toiletId) => set({ isOpen: true, selectedToiletId: toiletId }),
  closeDialog: () => set({ isOpen: false, selectedToiletId: null }),
}))

export function useCommentDialog() {
  const { isOpen, selectedToiletId, openDialog, closeDialog } = useCommentDialogStore()
  const [user, loading] = useAuthState(auth)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [newRating, setNewRating] = useState(5)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (!selectedToiletId || !isOpen) {
      setComments([])
      return
    }

    setIsLoadingComments(true)
    setError(null)

    const commentsRef = collection(db, "comments")
    const q = query(commentsRef, where("toiletId", "==", selectedToiletId))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const commentsData: Comment[] = []
        snapshot.forEach((doc) => {
          commentsData.push({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          } as Comment)
        })

        setComments(commentsData)
        setIsLoadingComments(false)
      },
      (error) => {
        console.error("Error loading comments:", error)
        setError("Erreur lors du chargement des commentaires")
        setIsLoadingComments(false)
      },
    )

    return () => unsubscribe()
  }, [selectedToiletId, isOpen])

  const handleSubmitComment = async (toiletId: string) => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour laisser un commentaire.",
        variant: "destructive",
      })
      return
    }

    if (!newComment.trim()) {
      toast({
        title: "Commentaire requis",
        description: "Veuillez saisir un commentaire.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const commentsRef = collection(db, "comments")
      await addDoc(commentsRef, {
        toiletId,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || user.email?.split("@")[0] || "Utilisateur",
        userAvatar: user.photoURL,
        content: newComment.trim(),
        rating: newRating,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      const toiletRef = doc(db, "toilets", toiletId)
      await updateDoc(toiletRef, {
        commentsCount: increment(1),
      })

      setNewComment("")
      setNewRating(5)

      toast({
        title: "Commentaire ajouté",
        description: "Votre commentaire a été publié avec succès.",
      })
    } catch (error) {
      console.error("Error adding comment:", error)
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le commentaire.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string, toiletId: string) => {
    if (!user) return

    try {
      await deleteDoc(doc(db, "comments", commentId))

      const toiletRef = doc(db, "toilets", toiletId)
      await updateDoc(toiletRef, {
        commentsCount: increment(-1),
      })
      console.log(commentId, toiletId);
      
      toast({
        title: "Commentaire supprimé",
        description: "Le commentaire a été supprimé avec succès.",
      })
    } catch (error) {
      console.error("Error deleting comment:", error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le commentaire.",
        variant: "destructive",
      })
    }
  }

  const formatCommentDate = (date: Date): string => {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  return {
    isOpen,
    selectedToiletId,
    comments,
    newComment,
    newRating,
    isSubmitting,
    isLoadingComments,
    error,
    user,
    loading,
    openDialog,
    closeDialog,
    setNewComment,
    setNewRating,
    submitComment: handleSubmitComment,
    deleteComment: handleDeleteComment,
    formatDate: formatCommentDate,
  }
}