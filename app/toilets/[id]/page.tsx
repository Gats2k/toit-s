"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  MapPin, Star, Navigation, Calendar, Clock, MessageCircle, 
  ThumbsUp, ThumbsDown, Flag, ChevronLeft, Edit, Share2, Trash2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/loading-spinner';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/hooks/use-toast';
import { useGeolocation } from '@/lib/geolocation';
import { 
  formatDistance, calculateDistance, formatDate, 
  getStatusColor, getFeatureLabel, getFeatureIcon
} from '@/lib/utils';
import { Toilet, ToiletFeature } from '@/lib/types';
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, increment, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { CommentDialog } from '@/components/comment-dialog';
import { useCommentDialog } from '@/store/useCommentDialog';

// Configuration pour les routes dynamiques
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface CommentWithVotes {
  id: string;
  toiletId: string;
  userId: string;
  userName: string;
  userImage: string;
  text: string;
  rating: number;
  createdAt: Date;
  helpfulCount?: number;
  notHelpfulCount?: number;
  userVote?: 'helpful' | 'not_helpful' | null;
}

export default function ToiletDetailPage() {
  const params = useParams();
  const { coordinates } = useGeolocation();
  const [toilet, setToilet] = useState<Toilet | null>(null);
  const [comments, setComments] = useState<CommentWithVotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthStore();
  const { toast } = useToast();
  const { openDialog } = useCommentDialog();
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isVoting, setIsVoting] = useState(false);
  
  // Charger la toilette et les commentaires depuis Firestore
  useEffect(() => {
    const fetchToilet = async () => {
      setLoading(true);
      const id = params.id as string;
      const docRef = doc(db, "toilets", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setToilet({
          id: docSnap.id,
          ...data,
          addedAt: data.addedAt?.toDate ? data.addedAt.toDate() : new Date(data.addedAt),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
        } as Toilet);
        
        // Charger les commentaires avec les votes
        const commentsRef = collection(db, "comments");
        const q = query(commentsRef, where("toiletId", "==", id));
        const querySnapshot = await getDocs(q);
        const commentsData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            toiletId: data.toiletId,
            userId: data.userId,
            userName: data.userName,
            userImage: data.userAvatar || data.userImage || '',
            text: data.content || data.text || '',
            rating: data.rating,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
            helpfulCount: data.helpfulCount || 0,
            notHelpfulCount: data.notHelpfulCount || 0,
            userVote: data.userVotes?.[user?.uid || ''] || null,
          } as CommentWithVotes;
        });
        setComments(commentsData);
      } else {
        setToilet(null);
      }
      setLoading(false);
    };
    fetchToilet();
  }, [params.id, user?.uid]);
  
  if (loading) {
    return <LoadingSpinner text="Loading toilet details..." />;
  }
  
  if (!toilet) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Toilet Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The toilet you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Button asChild>
          <Link href="/">
            <ChevronLeft size={16} className="mr-2" />
            Back to Home
          </Link>
        </Button>
      </div>
    );
  }
  
  const distance = coordinates 
    ? calculateDistance(coordinates, { latitude: toilet.latitude, longitude: toilet.longitude }) 
    : null;
  
  const statusColor = getStatusColor(toilet.status);
  
  const featureIcons: Record<ToiletFeature, string> = {
    wheelchair_accessible: 'Wheelchair',
    baby_changing: 'Baby',
    gender_neutral: 'Users',
    free: 'Ticket',
    requires_key: 'Key',
    '24h': 'Clock',
  };
  
  const renderStars = (rating: number, interactive = false) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = interactive 
            ? star <= (hoveredRating || newRating)
            : star <= rating;
          
          return (
            <Star
              key={star}
              className={`h-5 w-5 cursor-pointer transition-colors ${
                isFilled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
              }`}
              onClick={interactive ? () => setNewRating(star) : undefined}
              onMouseEnter={interactive ? () => setHoveredRating(star) : undefined}
              onMouseLeave={interactive ? () => setHoveredRating(0) : undefined}
            />
          );
        })}
      </div>
    );
  };

  const handleSubmitComment = async () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour laisser un commentaire.",
        variant: "destructive",
      });
      return;
    }

    if (!newComment.trim()) {
      toast({
        title: "Commentaire requis",
        description: "Veuillez saisir un commentaire.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const commentsRef = collection(db, "comments");
      await addDoc(commentsRef, {
        toiletId: toilet?.id,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || user.email?.split("@")[0] || "Utilisateur",
        userAvatar: user.photoURL,
        content: newComment.trim(),
        rating: newRating,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const toiletRef = doc(db, "toilets", toilet?.id);
      await updateDoc(toiletRef, {
        commentsCount: increment(1),
      });

      setNewComment("");
      setNewRating(5);

      toast({
        title: "Commentaire ajouté",
        description: "Votre commentaire a été publié avec succès.",
      });

      // Recharger les commentaires
      const commentsRefReload = collection(db, "comments");
      const q = query(commentsRefReload, where("toiletId", "==", toilet?.id));
      const querySnapshot = await getDocs(q);
      const commentsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          toiletId: data.toiletId,
          userId: data.userId,
          userName: data.userName,
          userImage: data.userAvatar || data.userImage || '',
          text: data.content || data.text || '',
          rating: data.rating,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        } as CommentWithVotes;
      });
      setComments(commentsData);
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le commentaire.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;

    try {
      // Supprimer le commentaire de Firestore
      const commentRef = doc(db, "comments", commentId);
      await deleteDoc(commentRef);

      // Mettre à jour le compteur de commentaires
      const toiletRef = doc(db, "toilets", toilet?.id);
      await updateDoc(toiletRef, {
        commentsCount: increment(-1),
      });

      // Mettre à jour l'état local
      setComments(comments.filter(comment => comment.id !== commentId));

      toast({
        title: "Commentaire supprimé",
        description: "Votre commentaire a été supprimé avec succès.",
      });
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le commentaire.",
        variant: "destructive",
      });
    }
  };

  // Fonction pour gérer les votes
  const handleVote = async (commentId: string, voteType: 'helpful' | 'not_helpful') => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour voter sur les commentaires.",
        variant: "destructive",
      });
      return;
    }

    setIsVoting(true);
    try {
      const commentRef = doc(db, "comments", commentId);
      const commentDoc = await getDoc(commentRef);
      
      if (!commentDoc.exists()) {
        throw new Error("Comment not found");
      }

      const commentData = commentDoc.data();
      const currentVote = commentData.userVotes?.[user.uid] || null;
      const helpfulCount = commentData.helpfulCount || 0;
      const notHelpfulCount = commentData.notHelpfulCount || 0;

      let newHelpfulCount = helpfulCount;
      let newNotHelpfulCount = notHelpfulCount;

      // Gérer les changements de vote
      if (currentVote === voteType) {
        // Retirer le vote
        if (voteType === 'helpful') {
          newHelpfulCount = Math.max(0, helpfulCount - 1);
        } else {
          newNotHelpfulCount = Math.max(0, notHelpfulCount - 1);
        }
        await updateDoc(commentRef, {
          [`userVotes.${user.uid}`]: null,
          helpfulCount: newHelpfulCount,
          notHelpfulCount: newNotHelpfulCount,
        });
      } else {
        // Ajouter ou changer le vote
        if (currentVote === 'helpful') {
          newHelpfulCount = Math.max(0, helpfulCount - 1);
          newNotHelpfulCount = notHelpfulCount + 1;
        } else if (currentVote === 'not_helpful') {
          newHelpfulCount = helpfulCount + 1;
          newNotHelpfulCount = Math.max(0, notHelpfulCount - 1);
        } else {
          if (voteType === 'helpful') {
            newHelpfulCount = helpfulCount + 1;
          } else {
            newNotHelpfulCount = notHelpfulCount + 1;
          }
        }
        await updateDoc(commentRef, {
          [`userVotes.${user.uid}`]: voteType,
          helpfulCount: newHelpfulCount,
          notHelpfulCount: newNotHelpfulCount,
        });
      }

      // Mettre à jour l'état local
      setComments(comments.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            helpfulCount: newHelpfulCount,
            notHelpfulCount: newNotHelpfulCount,
            userVote: currentVote === voteType ? null : voteType,
          };
        }
        return comment;
      }));

      toast({
        title: currentVote === voteType ? "Vote retiré" : "Vote enregistré",
        description: currentVote === voteType 
          ? "Votre vote a été retiré."
          : "Merci pour votre retour !",
      });
    } catch (error) {
      console.error("Error voting on comment:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer votre vote.",
        variant: "destructive",
      });
    } finally {
      setIsVoting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-2">
          <Link href="/">
            <ChevronLeft size={16} className="mr-1" />
            Back
          </Link>
        </Button>
        
      </div>
      
      <CommentDialog />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader className="relative pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{toilet.name}</CardTitle>
                <p className="text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin size={14} className="inline-block" />
                  {toilet.address}
                </p>
              </div>
              <Badge 
                variant={toilet.status === 'available' ? 'default' : 
                       toilet.status === 'occupied' ? 'outline' : 'destructive'}
                className="capitalize"
              >
                {toilet.status}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 mr-1" />
                <span className="font-medium">{toilet.rating.toFixed(1)}</span>
                <span className="text-muted-foreground ml-1">
                  ({comments.length} {comments.length === 1 ? 'review' : 'reviews'})
                </span>
              </div>
              
              {distance !== null && (
                <div className="text-sm flex items-center">
                  <Navigation size={14} className="inline-block mr-1" />
                  {formatDistance(distance)}
                </div>
              )}
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-medium mb-2">Features</h3>
              <div className="flex flex-wrap gap-2">
                {toilet.features.map((feature) => {
                  const IconComponent = featureIcons[feature];
                  const label = getFeatureLabel(feature);
                  
                  return (
                    <Badge key={feature} variant="outline" className="py-1">
                      {featureIcons[feature] && (
                        <span className="mr-1">{IconComponent}</span>
                      )}
                      {label}
                    </Badge>
                  );
                })}
              </div>
            </div>
            
            <Separator />
            
            <div className="flex flex-wrap gap-2 md:gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                <span>Added: {formatDate(toilet.addedAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>Last updated: {formatDate(toilet.updatedAt)}</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 pt-2">
              <Button asChild>
                <Link 
                  href={`https://www.google.com/maps/dir/?api=1&destination=${toilet.latitude},${toilet.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Navigation size={16} className="mr-2" />
                  Directions
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      <Tabs defaultValue="reviews" className="mt-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="reviews">
            <MessageCircle size={16} className="mr-2" />
            Reviews
          </TabsTrigger>
          <TabsTrigger value="info">
            <MapPin size={16} className="mr-2" />
            Additional Info
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="reviews" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Reviews</h2>
          </div>
          
          {user && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-medium mb-4">Ajouter un commentaire</h3>
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Partagez votre expérience..."
                  className="min-h-[100px] mb-3"
                />
                <div className="flex items-center gap-4 mb-4">
                  <span className="font-medium">Note:</span>
                  {renderStars(newRating, true)}
                  <span className="text-sm text-muted-foreground">
                    {newRating} {newRating === 1 ? 'étoile' : 'étoiles'}
                  </span>
                </div>
                <Button
                  onClick={handleSubmitComment}
                  disabled={isSubmitting || !newComment.trim()}
                  className="w-full"
                >
                  {isSubmitting ? "Publication..." : "Publier le commentaire"}
                </Button>
              </CardContent>
            </Card>
          )}
          
          {comments.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-muted/10">
              <MessageCircle size={24} className="mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">No reviews yet.</p>
              <p className="text-sm text-muted-foreground mt-1">Be the first to add a review!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <Card key={comment.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <Avatar>
                        <AvatarImage src={comment.userImage} alt={comment.userName} />
                        <AvatarFallback>{comment.userName?.charAt(0) || 'A'}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{comment.userName}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(comment.createdAt.toISOString())}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {comment.rating && (
                              <div className="flex items-center">
                                {renderStars(comment.rating)}
                              </div>
                            )}
                            {user && user.uid === comment.userId && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteComment(comment.id)}
                              >
                                <Trash2 size={14} />
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm">{comment.text}</p>
                        
                        <div className="flex items-center gap-2 pt-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`h-8 px-2 ${comment.userVote === 'helpful' ? 'text-primary' : ''}`}
                            onClick={() => handleVote(comment.id, 'helpful')}
                            disabled={isVoting}
                          >
                            <ThumbsUp size={14} className="mr-1" />
                            <span className="text-xs">
                              Helpful {comment.helpfulCount ? `(${comment.helpfulCount})` : ''}
                            </span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`h-8 px-2 ${comment.userVote === 'not_helpful' ? 'text-destructive' : ''}`}
                            onClick={() => handleVote(comment.id, 'not_helpful')}
                            disabled={isVoting}
                          >
                            <ThumbsDown size={14} className="mr-1" />
                            <span className="text-xs">
                              Not helpful {comment.notHelpfulCount ? `(${comment.notHelpfulCount})` : ''}
                            </span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="info" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-medium mb-2">Opening Hours</h3>
              <p className="text-sm text-muted-foreground">
                {toilet.features.includes('24h') 
                  ? 'Open 24 hours' 
                  : 'Information not available'}
              </p>
              
              <Separator className="my-4" />
              
              <h3 className="font-medium mb-2">Accessibility Information</h3>
              <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                {toilet.features.includes('wheelchair_accessible') && (
                  <li>Wheelchair accessible</li>
                )}
                {toilet.features.includes('baby_changing') && (
                  <li>Baby changing facilities available</li>
                )}
                {toilet.features.includes('gender_neutral') && (
                  <li>Gender neutral options available</li>
                )}
                {!toilet.features.includes('wheelchair_accessible') &&
                 !toilet.features.includes('baby_changing') &&
                 !toilet.features.includes('gender_neutral') && (
                  <li>No detailed accessibility information available</li>
                )}
              </ul>
              
              <Separator className="my-4" />
              
              <h3 className="font-medium mb-2">Additional Notes</h3>
              <p className="text-sm text-muted-foreground">
                {toilet.features.includes('requires_key') 
                  ? 'This toilet requires a key. You may need to ask staff at nearby establishments.'
                  : toilet.features.includes('free')
                  ? 'This toilet is free to use.'
                  : 'No additional information available.'}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}