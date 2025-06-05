"use client"

import React from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { Loader2, AlertCircle, RefreshCw } from "lucide-react"

import type { Toilet } from "@/lib/types"
import { ToiletCard } from "./toilet-card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { auth } from "@/firebase/client"
import { useToilets } from "@/store/useToilet"

interface ToiletListProps {
  userCoordinates?: { latitude: number; longitude: number } | null
  searchQuery?: string
  filters?: {
    features?: string[]
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
    // ... (même implémentation que précédemment)
  }

  const filteredToilets = React.useMemo(() => {
    // ... (même logique de filtrage que précédemment)
    // Example placeholder logic:
    if (!toilets) return [];
    // Apply filtering logic here and return the filtered array
    return toilets.filter((toilet: Toilet) => {
      // Example: filter by searchQuery
      if (searchQuery && !toilet.name?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Add more filter logic as needed
      return true;
    });
  }, [toilets, searchQuery])

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

  return (
    <div className="space-y-6 md:px-4 lg:px-0 w-full h-full" >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {filteredToilets.map((toilet : Toilet) => (
          <ToiletCard 
            key={toilet.id} 
            toilet={toilet} 
          />
        ))}
      </div>
    </div>
  )
}