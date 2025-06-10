"use client"

import { useState } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { useToast } from "@/hooks/use-toast"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { MapPin, Plus } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { auth, db } from "@/firebase/client"
import type { ToiletFeature, ToiletStatus } from "@/lib/types"

const features: { id: ToiletFeature; label: string }[] = [
  { id: "wheelchair_accessible", label: "Accessible aux fauteuils roulants" },
  { id: "baby_changing", label: "Table à langer" },
  { id: "gender_neutral", label: "Mixte" },
  { id: "free", label: "Gratuit" },
  { id: "requires_key", label: "Clé requise" },
  { id: "24h", label: "24h/24" },
]

const statuses: { id: ToiletStatus; label: string }[] = [
  { id: "available", label: "Disponible" },
  { id: "occupied", label: "Occupé" },
  { id: "out_of_order", label: "Hors service" },
]

interface AddToiletFormProps {
  variant?: "button" | "link"
  className?: string
}

export function AddToiletForm({ variant = "button", className }: AddToiletFormProps) {
  const [user] = useAuthState(auth)
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    latitude: "",
    longitude: "",
    status: "available" as ToiletStatus,
    features: [] as ToiletFeature[],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour ajouter une toilette",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      const toiletData = {
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        rating: 0,
        addedBy: user.uid,
        addedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      await addDoc(collection(db, "toilets"), toiletData)

      toast({
        title: "Succès",
        description: "La toilette a été ajoutée avec succès",
      })

      setIsOpen(false)
      setFormData({
        name: "",
        address: "",
        latitude: "",
        longitude: "",
        status: "available",
        features: [],
      })
    } catch (error) {
      console.error("Error adding toilet:", error)
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout de la toilette",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFeatureChange = (feature: ToiletFeature, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      features: checked
        ? [...prev.features, feature]
        : prev.features.filter((f) => f !== feature),
    }))
  }

  const trigger = variant === "button" ? (
    <Button className={className}>
      <Plus className="mr-2 h-4 w-4" />
      Ajouter une toilette
    </Button>
  ) : (
    <Link
      href="#"
      onClick={(e) => {
        e.preventDefault()
        setIsOpen(true)
      }}
      className={className}
    >
      <Plus className="mr-2 h-4 w-4" />
      Add Toilet
    </Link>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter une nouvelle toilette</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nom de l'établissement"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Adresse</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Adresse complète"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                placeholder="48.8566"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                placeholder="2.3522"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Statut</Label>
            <div className="grid grid-cols-3 gap-2">
              {statuses.map((status) => (
                <Button
                  key={status.id}
                  type="button"
                  variant={formData.status === status.id ? "default" : "outline"}
                  onClick={() => setFormData({ ...formData, status: status.id })}
                  className="w-full"
                >
                  {status.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Caractéristiques</Label>
            <div className="grid grid-cols-2 gap-2">
              {features.map((feature) => (
                <div key={feature.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={feature.id}
                    checked={formData.features.includes(feature.id)}
                    onCheckedChange={(checked) =>
                      handleFeatureChange(feature.id, checked as boolean)
                    }
                  />
                  <Label htmlFor={feature.id}>{feature.label}</Label>
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Ajout en cours..." : "Ajouter la toilette"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
} 