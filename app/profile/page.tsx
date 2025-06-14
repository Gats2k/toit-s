'use client'

import React, { useState } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/firebase/client'
import { updateProfile, updateEmail, updatePassword } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2 } from 'lucide-react'

export default function ProfilePage() {
  const [user, loading, error] = useAuthState(auth)
  const router = useRouter()

  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [email, setEmail] = useState(user?.email || '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/') // Redirect if not authenticated
    }
    if (user) {
      setDisplayName(user.displayName || '')
      setEmail(user.email || '')
    }
  }, [user, loading, router])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdatingProfile(true)
    setProfileMessage('')

    try {
      if (user) {
        // Update display name
        if (displayName !== user.displayName) {
          await updateProfile(user, { displayName })
          setProfileMessage('Nom d\'affichage mis à jour.')
        }

        // Update email
        if (email !== user.email) {
          await updateEmail(user, email)
          setProfileMessage(prev => prev + ' Email mis à jour.')
        }

        // Update password
        if (password && password === confirmPassword) {
          await updatePassword(user, password)
          setProfileMessage(prev => prev + ' Mot de passe mis à jour.')
          setPassword('')
          setConfirmPassword('')
        } else if (password && password !== confirmPassword) {
          setProfileMessage('Les mots de passe ne correspondent pas.')
        }

        setProfileMessage(prev => prev || 'Aucune modification à appliquer.')
      }
    } catch (err: any) {
      console.error('Error updating profile:', err)
      setProfileMessage(`Erreur lors de la mise à jour : ${err.message}`)
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) {
      try {
        if (user) {
          await user.delete()
          // Redirect after successful deletion
          router.push('/')
        }
      } catch (err: any) {
        console.error('Error deleting account:', err)
        setProfileMessage(`Erreur lors de la suppression du compte : ${err.message}`)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-destructive">
        <p>Erreur de chargement du profil: {error.message}</p>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to home via useEffect
  }

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Mon Profil</CardTitle>
          <CardDescription>Gérez les informations de votre compte.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.photoURL || undefined} />
              <AvatarFallback className="text-4xl">{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-semibold">{user.displayName || 'Utilisateur'}</h2>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <Separator />

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="displayName">Nom d'affichage</Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Votre nom d'affichage"
                disabled={isUpdatingProfile}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Votre email"
                disabled={isUpdatingProfile}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Nouveau mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 caractères"
                disabled={isUpdatingProfile}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmez votre mot de passe"
                disabled={isUpdatingProfile}
              />
            </div>
            {profileMessage && (
              <p className="text-sm text-center" style={{ color: profileMessage.includes('Erreur') ? 'red' : 'green' }}>
                {profileMessage}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={isUpdatingProfile}>
              {isUpdatingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Mettre à jour le profil
            </Button>
          </form>

          <Separator />

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Supprimer le compte</h3>
            <p className="text-muted-foreground text-sm">
              Cette action est irréversible. Toutes vos données seront définitivement supprimées.
            </p>
            <Button variant="destructive" onClick={handleDeleteAccount} className="w-full">
              Supprimer mon compte
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 