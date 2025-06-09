"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Star, Send, MessageSquare, ThumbsUp, ThumbsDown, AlertCircle, Trash2 } from "lucide-react"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { useAuthStore } from "@/store/useAuthStore"
import type { Comment, Like, Toilet } from "@/lib/types"
import { addComment, addLike, getComments, getLikes, removeLike, deleteComment } from "@/lib/firestore"
import { useCommentDialog } from "@/store/useCommentDialog"

// Mock toilet data - replace with actual data fetching
const mockToilets: any = [
  {
    id: "1",
    name: "Toilettes Publiques Place de la République",
    address: "Place de la République, 75011 Paris",
    latitude: 48.8676,
    longitude: 2.3631,
    rating: 4.2,
    reviewCount: 15,
    features: ["wheelchair_accessible", "free", "24h"],
    addedBy: "mock-user",
    addedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export function CommentDialog() {
  const { isOpen, selectedToiletId, closeDialog } = useCommentDialog()
  const { user, setAuthDialogOpen } = useAuthStore()
  const [toilet, setToilet] = useState<Toilet | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [likes, setLikes] = useState<Like[]>([])
  const [userLike, setUserLike] = useState<Like | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [userName, setUserName] = useState("")
  const [commentText, setCommentText] = useState("")
  const [rating, setRating] = useState(0)
  const [hoveredStar, setHoveredStar] = useState(0)

  // Load toilet data and comments when dialog opens

  const loadToiletData = useCallback(async () => {
    if (!selectedToiletId) return

    setIsLoading(true)
    try {
      // Find toilet in mock data - replace with actual Firestore query
      const foundToilet = mockToilets.find((t : any) => t.id === selectedToiletId)
      setToilet(foundToilet || null)

      // Load comments and likes
      const [commentsData, likesData] = await Promise.all([getComments(selectedToiletId), getLikes(selectedToiletId)])

      setComments(commentsData)
      setLikes(likesData)

      // Find user's like/dislike
      if (user) {
        const userLikeData = likesData.find((like) => like.userId === user.uid)
        setUserLike(userLikeData || null)
      }
    } catch (error) {
      console.error("Error loading toilet data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedToiletId, user])

  useEffect(() => {
    if (isOpen && selectedToiletId) {
      loadToiletData()
    }
  }, [isOpen, selectedToiletId, loadToiletData])

  // Set user name from auth
  useEffect(() => {
    if (user) {
      setUserName(user.displayName || user.email?.split("@")[0] || "")
    }
  }, [user])

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedToiletId || !userName.trim() || !commentText.trim() || rating === 0) return

    if (!user) {
      setAuthDialogOpen(true)
      return
    }

    setIsSubmitting(true)
    try {
      const newComment = await addComment({
        toiletId: selectedToiletId,
        userId: user.uid,
        userName: userName.trim(),
        content: commentText.trim(),
        rating,
      })

      setComments((prev : any) => [{
        ...newComment,
        text: newComment.content,
        userImage: `https://api.dicebear.com/7.x/initials/svg?seed=${userName.trim()}`
      }, ...prev])
      setCommentText("")
      setRating(0)
    } catch (error) {
      console.error("Error adding comment:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLikeDislike = async (type: "like" | "dislike") => {
    if (!selectedToiletId || !user) {
      setAuthDialogOpen(true)
      return
    }

    try {
      // If user already has the same reaction, remove it
      if (userLike?.type === type) {
        await removeLike(selectedToiletId, user.uid)
        setLikes((prev) => prev.filter((like) => like.userId !== user.uid))
        setUserLike(null)
      } else {
        // Add new like/dislike (this will replace any existing one)
        const newLike = await addLike({
          toiletId: selectedToiletId,
          userId: user.uid,
          type,
        })

        setLikes((prev) => {
          const filtered = prev.filter((like) => like.userId !== user.uid)
          return [...filtered, newLike]
        })
        setUserLike(newLike)
      }
    } catch (error) {
      console.error("Error handling like/dislike:", error)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!selectedToiletId || !user) return

    try {
      await deleteComment(commentId, selectedToiletId)
      setComments((prev) => prev.filter((comment) => comment.id !== commentId))
    } catch (error) {
      console.error("Error deleting comment:", error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const renderStars = (currentRating: number, interactive = false) => {
    return Array.from({ length: 5 }, (_, i) => {
      const starValue = i + 1
      const isFilled = interactive ? starValue <= (hoveredStar || rating) : starValue <= currentRating

      return (
        <Star
          key={i}
          size={interactive ? 24 : 16}
          className={`${
            isFilled ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          } ${interactive ? "cursor-pointer hover:scale-110 transition-transform" : ""}`}
          onClick={interactive ? () => setRating(starValue) : undefined}
          onMouseEnter={interactive ? () => setHoveredStar(starValue) : undefined}
          onMouseLeave={interactive ? () => setHoveredStar(0) : undefined}
        />
      )
    })
  }

  const likesCount = likes.filter((like) => like.type === "like").length
  const dislikesCount = likes.filter((like) => like.type === "dislike").length

  return (
    <Dialog open={isOpen} onOpenChange={closeDialog}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare size={20} />
            Commentaires et avis
          </DialogTitle>
          {toilet && (
            <DialogDescription className="text-left">
              <div className="font-medium text-foreground">{toilet.name}</div>
              <div className="text-sm text-muted-foreground">{toilet.address}</div>
            </DialogDescription>
          )}
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Chargement...</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            {/* Stats */}
            <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} />
                <span className="text-sm font-medium">
                  {comments.length} commentaire{comments.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant={userLike?.type === "like" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleLikeDislike("like")}
                  className="flex items-center gap-1"
                >
                  <ThumbsUp size={16} />
                  {likesCount}
                </Button>
                <Button
                  variant={userLike?.type === "dislike" ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => handleLikeDislike("dislike")}
                  className="flex items-center gap-1"
                >
                  <ThumbsDown size={16} />
                  {dislikesCount}
                </Button>
              </div>
            </div>

            {/* Auth Alert */}
            {!user && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Vous devez être connecté pour laisser un commentaire ou noter cet établissement.
                  <Button variant="link" className="p-0 h-auto ml-1" onClick={() => setAuthDialogOpen(true)}>
                    Se connecter
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Comment Form */}
            {user && (
              <form onSubmit={handleSubmitComment} className="space-y-4 p-4 border rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="userName">Votre nom</Label>
                    <Input
                      id="userName"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Entrez votre nom"
                      required
                    />
                  </div>
                  <div>
                    <Label>Note</Label>
                    <div className="flex items-center gap-1 mt-1">{renderStars(rating, true)}</div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="comment">Votre commentaire</Label>
                  <Textarea
                    id="comment"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Partagez votre expérience..."
                    className="min-h-[80px] resize-none"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || !userName.trim() || !commentText.trim() || rating === 0}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Publication...
                    </>
                  ) : (
                    <>
                      <Send size={16} className="mr-2" />
                      Publier le commentaire
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* Comments List */}
            <div className="flex-1 min-h-0">
              <h3 className="font-medium mb-3">Commentaires récents</h3>
              {comments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare size={48} className="mx-auto mb-2 opacity-50" />
                  <p>Aucun commentaire pour le moment.</p>
                  <p className="text-sm">Soyez le premier à partager votre avis !</p>
                </div>
              ) : (
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-4">
                    {comments.map((comment, index) => (
                      <div key={comment.id}>
                        <div className="flex gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={comment.userImage} />
                          </Avatar>

                          <div className="flex-1 space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{comment.userName}</span>
                                <div className="flex items-center">{renderStars(comment.rating)}</div>
                                <Badge variant="outline" className="text-xs">
                                  {formatDate(comment.createdAt)}
                                </Badge>
                              </div>
                              {user && comment.userId === user.uid && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="flex items-center gap-1"
                                  onClick={() => handleDeleteComment(comment.id)}
                                >
                                  <Trash2 size={14} />
                                  <span>Supprimer</span>
                                </Button>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">{comment.text}</p>
                          </div>
                        </div>

                        {index < comments.length - 1 && <Separator className="mt-4" />}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
