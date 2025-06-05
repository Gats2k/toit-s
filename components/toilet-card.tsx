"use client"

import { useState } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { useToast } from "@/hooks/use-toast"
import { Star, MessageSquare, ThumbsUp, ThumbsDown, Check, X, Clock, MapPin, User } from "lucide-react"
import { doc, updateDoc, arrayUnion, increment, collection, addDoc } from "firebase/firestore"
import { useRouter } from "next/navigation"

import type { Toilet } from "@/lib/types"
import { calculateDistance } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { auth, db } from "@/firebase/client"
import { useCommentDialog } from "@/store/useCommentDialog"
interface ToiletCardProps {
  toilet: Toilet
  userCoordinates?: { latitude: number; longitude: number }
}
export function ToiletCard({ toilet, userCoordinates }: ToiletCardProps) {
  const router = useRouter()
  const [isHovered, setIsHovered] = useState(false)
  const [user] = useAuthState(auth)
  const { toast } = useToast()
  const { 
    isOpen,
    comments,
    newComment,
    newRating,
    isSubmitting,
    isLoadingComments,
    openDialog,
    closeDialog,
    setNewComment,
    setNewRating,
    submitComment,
    deleteComment,
  } = useCommentDialog()

  const distance = userCoordinates
    ? calculateDistance(userCoordinates, { latitude: toilet.latitude, longitude: toilet.longitude })
    : null

  const handleViewRoute = () => {
    router.push(`/map?destination=${toilet.latitude},${toilet.longitude}`)
  }

  const handleLike = async () => {
    try {
      if (!user) {
        toast({
          title: "Erreur",
          description: "Vous devez être connecté pour liker",
          variant: "destructive",
        })
        return
      }

      const toiletRef = doc(db, "toilets", toilet.id)
      const likesRef = collection(db, "toilets", toilet.id, "likes")
      
      // Vérifier si l'utilisateur a déjà liké
      await addDoc(likesRef, {
        userId: user.uid,
        createdAt: new Date().toISOString()
      })

      await updateDoc(toiletRef, {
        rating: increment(0.1)
      })

      toast({
        title: "Merci !",
        description: "Votre like a été enregistré",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Vous avez déjà liké ces toilettes",
        variant: "destructive",
      })
    }
  }

  const handleDislike = async () => {
    try {
      if (!user) {
        toast({
          title: "Erreur",
          description: "Vous devez être connecté pour signaler un problème",
          variant: "destructive",
        })
        return
      }

      const dislikesRef = collection(db, "toilets", toilet.id, "dislikes")
      await addDoc(dislikesRef, {
        userId: user.uid,
        createdAt: new Date().toISOString(),
        reason: "Problème signalé"
      })

      toast({
        title: "Signalement envoyé",
        description: "Nous avons pris en compte votre retour",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du signalement",
        variant: "destructive",
      })
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-5 h-5 ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : ''} 
            ${i === Math.floor(rating) && rating % 1 >= 0.5 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
        <span className="ml-2 text-sm text-gray-500">({toilet.rating?.toFixed(1)})</span>
      </div>
    )
  }

  const getStatusBadge = () => {
    const statusMap = {
      available: { text: "Disponible", color: "bg-green-100 text-green-800" },
      closed: { text: "Fermé", color: "bg-red-100 text-red-800" },
      occupied: { text: "Occupé", color: "bg-yellow-100 text-yellow-800" }
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusMap[toilet.status].color}`}>
        {statusMap[toilet.status].text}
      </span>
    )
  }

  return (
    <div className="">   
    <Card className="w-full max-w-md mx-auto px-150 hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg flex items-center gap-2">
            {toilet.name}
            {getStatusBadge()}
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleViewRoute}
            className="text-blue-600 hover:text-blue-800"
          >
            <MapPin className="w-4 h-4 mr-1" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <User className="w-4 h-4 text-gray-500" />
          <span>Ajouté par: {toilet.addedBy || "Anonyme"}</span>
        </div>

        <p className="text-sm text-gray-700">{toilet.address}</p>

        {distance && (
          <p className="text-sm text-gray-500">
            À {distance.toFixed(1)} km de votre position
          </p>
        )}

        <div className="py-2">
          {toilet.rating ? renderStars(toilet.rating) : "Pas encore noté"}
        </div>

        {toilet.features?.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {toilet.features.map((feature, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {feature}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between border-t pt-4">
        <Button 
          variant="outline" 
          onClick={() => openDialog(toilet.id)}
          className="flex items-center gap-1"
        >
          <MessageSquare className="w-4 h-4" />
        </Button>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLike}
            className="flex items-center gap-1"
          >
            <ThumbsUp className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDislike}
            className="flex items-center gap-1"
          >
            <ThumbsDown className="w-4 h-4" />
          </Button>
        </div>
      </CardFooter>

    </Card>
      <Dialog open={isOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">{toilet.name}</DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              {toilet.address} • {distance && `${distance.toFixed(1)} km`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Statut</h4>
                <div className="flex items-center gap-2">
                  {getStatusBadge()}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Évaluation</h4>
                {toilet.rating ? renderStars(toilet.rating) : "Pas encore noté"}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Caractéristiques</h4>
              <div className="flex flex-wrap gap-2">
                {toilet.features?.map((feature, index) => (
                  <Badge key={index} variant="outline">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Ajouter un commentaire</h4>
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Partagez votre expérience..."
                className="min-h-[100px] mb-3"
              />
              <div className="flex items-center gap-4 mb-4">
                <span className="font-medium">Note:</span>
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={newRating}
                    onChange={(e) => setNewRating(Number(e.target.value))}
                    className="w-full max-w-xs"
                  />
                  <span className="w-10 text-center">{newRating}</span>
                </div>
              </div>
              <Button
                onClick={() => submitComment(toilet.id)}
                disabled={isSubmitting || !newComment.trim()}
                className="w-full"
              >
                {isSubmitting ? "Publication..." : "Publier le commentaire"}
              </Button>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Commentaires ({comments.length})</h4>
              {isLoadingComments ? (
                <div className="flex justify-center py-8">
                  <p>Chargement des commentaires...</p>
                </div>
              ) : comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={comment.userAvatar} />
                          <AvatarFallback>{comment.userName?.charAt(0) || "A"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{comment.userName || "Anonyme"}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(comment.createdAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </span>
                            {user?.uid === comment.userId && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteComment(toilet.id, comment.id)}
                                className="ml-auto text-red-500 text-xs"
                              >
                                Supprimer
                              </Button>
                            )}
                          </div>
                          <div className="my-1">
                            {renderStars(comment.rating)}
                          </div>
                          <p className="text-sm text-gray-700">{comment.text}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Aucun commentaire pour le moment</p>
                  <p className="text-sm">Soyez le premier à commenter !</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
     </div>
  )
}