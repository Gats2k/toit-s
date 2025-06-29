"use client"

import React from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { Loader2, AlertCircle, RefreshCw } from "lucide-react"

import type { Toilet, ToiletFeature } from "@/lib/types"
import { ToiletCard } from "./toilet-card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { auth } from "@/firebase/client"
import { useToilets } from "@/store/useToilet"

interface ToiletListProps {
  userCoordinates?: { latitude: number; longitude: number } | null
  searchQuery?: string
  filters?: {
    features?: ToiletFeature[]
    status?: string
    maxDistance?: number
  }
}

export const ToiletList: React.FC<ToiletListProps> = ({ 
  userCoordinates, 
  searchQuery = "", 
  filters = {} 
}) => {
  const { toilets, loading, error } = useToilets()
  const [user] = useAuthState(auth)

  const calculateDistance = (
    coord1: { latitude: number; longitude: number },
    coord2: { latitude: number; longitude: number },
  ) => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
    const dLon = (coord2.longitude - coord1.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(coord1.latitude * Math.PI / 180) * Math.cos(coord2.latitude * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  const filteredToilets = React.useMemo(() => {
    if (!toilets) return [];
    
    let result = [...toilets];
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(toilet => 
        toilet.name?.toLowerCase().includes(query) || 
        toilet.address?.toLowerCase().includes(query)
      );
    }
    
    // Filter by features
    if (filters.features && filters.features.length > 0) {
      result = result.filter(toilet => 
        filters.features!.every(feature => 
          toilet.features?.includes(feature)
        )
      );
    }
    
    // Filter by status
    if (filters.status) {
      result = result.filter(toilet => toilet.status === filters.status);
    }
    
    // Filter by distance if user coordinates are available
    if (userCoordinates && filters.maxDistance) {
      result = result.filter(toilet => {
        const distance = calculateDistance(
          userCoordinates,
          { latitude: toilet.latitude, longitude: toilet.longitude }
        );
        return distance <= filters.maxDistance!;
      });
    }
    
    return result;
  }, [toilets, searchQuery, filters, userCoordinates])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-lg text-gray-600">Loading toilets...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => window.location.reload()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  if (filteredToilets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Aucune toilette trouvée avec les critères actuels.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6 md:px-4 lg:px-0 w-full h-full" >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {filteredToilets.map((toilet : Toilet) => (
          <ToiletCard 
            key={toilet.id} 
            toilet={toilet}
            userCoordinates={userCoordinates || undefined}
          />
        ))}
      </div>
    </div>
  )
}