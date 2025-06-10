"use client"

import { useState } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { useToast } from "@/hooks/use-toast"
import { Star, MessageSquare, ThumbsUp, ThumbsDown, Check, X, Clock, MapPin, User, ChevronRight, Armchair, Baby, Users, Ticket, Key } from "lucide-react"
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
          description: "Vous devez être connecté pour disliker",
          variant: "destructive",
        })
        return
      }

      const toiletRef = doc(db, "toilets", toilet.id)
      const dislikesRef = collection(db, "toilets", toilet.id, "dislikes")
      
      await addDoc(dislikesRef, {
        userId: user.uid,
        createdAt: new Date().toISOString()
      })

      await updateDoc(toiletRef, {
        rating: increment(-0.1)
      })

      toast({
        title: "Merci !",
        description: "Votre dislike a été enregistré",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Vous avez déjà disliké ces toilettes",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = () => {
    const statusColors = {
      available: "bg-green-500",
      occupied: "bg-orange-500",
      out_of_order: "bg-red-500",
    }

    const statusLabels = {
      available: "Disponible",
      occupied: "Occupé",
      out_of_order: "Hors service",
    }

    return (
      <Badge className={`${statusColors[toilet.status]} text-white`}>
        {statusLabels[toilet.status]}
      </Badge>
    )
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    )
  }

  const getFeatureIcon = (feature: string) => {
    const icons = {
      wheelchair_accessible: <Armchair className="w-4 h-4" />,
      baby_changing: <Baby className="w-4 h-4" />,
      gender_neutral: <Users className="w-4 h-4" />,
      free: <Ticket className="w-4 h-4" />,
      requires_key: <Key className="w-4 h-4" />,
      "24h": <Clock className="w-4 h-4" />,
    }
    return icons[feature as keyof typeof icons]
  }

  return (
    <div className="h-full">   
      <Card className="h-full hover:shadow-lg transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-2 flex-1">
              <CardTitle className="text-xl font-bold">{toilet.name}</CardTitle>
              <div className="flex items-center gap-2">
                {getStatusBadge()}
                {distance && (
                  <span className="text-sm text-muted-foreground">
                    {distance.toFixed(1)} km
                  </span>
                )}
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleViewRoute}
              className="text-blue-600 hover:text-blue-800 shrink-0"
            >
              <MapPin className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground mt-1 shrink-0" />
            <p className="text-sm text-muted-foreground">{toilet.address}</p>
          </div>

          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground">
              Ajouté par: {toilet.addedBy || "Anonyme"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {toilet.rating ? (
              <>
                {renderStars(toilet.rating)}
                <span className="text-sm text-muted-foreground">
                  ({toilet.rating.toFixed(1)})
                </span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">Pas encore noté</span>
            )}
          </div>

          {toilet.features?.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {toilet.features.map((feature, index) => (
                <Badge key={index} variant="outline" className="flex items-center gap-1">
                  {getFeatureIcon(feature)}
                  <span className="text-xs">
                    {feature === "wheelchair_accessible" && "Accessible"}
                    {feature === "baby_changing" && "Table à langer"}
                    {feature === "gender_neutral" && "Mixte"}
                    {feature === "free" && "Gratuit"}
                    {feature === "requires_key" && "Clé requise"}
                    {feature === "24h" && "24h/24"}
                  </span>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between border-t pt-4">
          <Button 
            variant="outline" 
            onClick={() => router.push(`/toilets/${toilet.id}`)}
            className="flex items-center gap-1"
          >
            <ChevronRight className="w-4 h-4" />
            Voir plus
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
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    {getFeatureIcon(feature)}
                    <span>
                      {feature === "wheelchair_accessible" && "Accessible"}
                      {feature === "baby_changing" && "Table à langer"}
                      {feature === "gender_neutral" && "Mixte"}
                      {feature === "free" && "Gratuit"}
                      {feature === "requires_key" && "Clé requise"}
                      {feature === "24h" && "24h/24"}
                    </span>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}