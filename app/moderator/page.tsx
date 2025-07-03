"use client"

import React, { useEffect, useState } from 'react'
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/firebase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { UserRole, isSuperAdmin } from '@/lib/roles'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { LayoutGrid, List, Shield } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/store/useAuthStore'

interface User {
  id: string
  email: string | null
  displayName: string | null
  role: UserRole
  isActive: boolean
  photoURL: string | null
  createdAt: Date | null
  lastLogin: Date | null
}

const ModeratorPage = () => {
  const [users, setUsers] = React.useState<User[]>([])
  const [loading, setLoading] = React.useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table')
  const [searchQuery, setSearchQuery] = useState('')
  const { user: currentUser } = useAuthStore()

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        const usersCollection = collection(db, 'users')
        const usersSnapshot = await getDocs(usersCollection)
        const usersList = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || null,
          lastLogin: doc.data().lastLogin?.toDate() || null
        })) as User[]
        setUsers(usersList)
      } catch (error) {
        console.error('Error fetching users:', error)
        toast.error('Erreur lors du chargement des utilisateurs')
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  // Les modérateurs ne peuvent pas modifier/supprimer les super admins ou les autres modérateurs
  const canModifyOrDelete = (target: User) => {
    if (!target.role) return false
    return target.role !== 'super_admin' && target.role !== 'moderator'
  }

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    const targetUser = users.find(u => u.id === userId)
    if (!targetUser || !canModifyOrDelete(targetUser)) {
      toast.error('Action non autorisée')
      return
    }
    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, { role: newRole })
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ))
      toast.success('Rôle mis à jour avec succès')
    } catch (error) {
      console.error('Error updating role:', error)
      toast.error('Erreur lors de la mise à jour du rôle')
    }
  }

  const handleStatusChange = async (userId: string, isActive: boolean) => {
    const targetUser = users.find(u => u.id === userId)
    if (!targetUser || !canModifyOrDelete(targetUser)) {
      toast.error('Action non autorisée')
      return
    }
    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, { isActive })
      setUsers(users.map(user => 
        user.id === userId ? { ...user, isActive } : user
      ))
      toast.success(`Utilisateur ${isActive ? 'activé' : 'désactivé'} avec succès`)
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Erreur lors de la mise à jour du statut')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    const targetUser = users.find(u => u.id === userId)
    if (!targetUser || !canModifyOrDelete(targetUser)) {
      toast.error('Action non autorisée')
      return
    }
    try {
      const userRef = doc(db, 'users', userId)
      await deleteDoc(userRef)
      setUsers(users.filter(user => user.id !== userId))
      toast.success('Utilisateur supprimé avec succès')
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Erreur lors de la suppression de l\'utilisateur')
    }
  }

  const filteredUsers = users.filter(user => 
    (user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <Skeleton className="h-8 w-[250px]" />
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <Skeleton className="h-9 w-[200px]" />
                <Skeleton className="h-10 w-[90px]" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const UserCard = ({ user }: { user: User }) => {
    const canEdit = canModifyOrDelete(user)
    return (
      <Card className="w-full hover:shadow-lg transition-shadow duration-200 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-16 w-16 border-2 border-primary/20">
              <AvatarImage src={user.photoURL || undefined} alt={user.displayName || ''} />
              <AvatarFallback className="text-lg">{user.displayName?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg truncate">{user.displayName || 'Non défini'}</h3>
              </div>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">Rôle</span>
              <div className="flex items-center gap-2">
                <Badge variant={user.role === 'super_admin' ? 'default' : 'secondary'}>
                  {user.role || 'citizen'}
                </Badge>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">Statut</span>
              <Switch
                checked={user.isActive}
                onCheckedChange={(checked) => handleStatusChange(user.id, checked)}
                disabled={!canEdit}
              />
            </div>
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">Créé le</span>
              <span className="text-sm">
                {user.createdAt ? format(user.createdAt, 'dd MMM yyyy', { locale: fr }) : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">Dernière connexion</span>
              <span className="text-sm">
                {user.lastLogin ? format(user.lastLogin, 'dd MMM yyyy HH:mm', { locale: fr }) : 'N/A'}
              </span>
            </div>
            <div className="flex gap-2 pt-4">
              <Select
                defaultValue={user.role || 'citizen'}
                onValueChange={(value: UserRole) => handleRoleChange(user.id, value)}
                disabled={!canEdit}
              >
                <SelectTrigger className="w-full" disabled={!canEdit}>
                  <SelectValue placeholder={canEdit ? "Changer le rôle" : "Rôle protégé"} />
                </SelectTrigger>
                <SelectContent>
                  {['municipal_rep', 'citizen'].map((role) => (
                    <SelectItem key={role} value={role}>
                      {role === 'municipal_rep' ? 'Représentant Municipal' : 'Utilisateur'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {canEdit ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="flex-1">
                      Supprimer
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action est irréversible. L'utilisateur sera définitivement supprimé.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>
                        Confirmer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <Button variant="outline" size="sm" className="flex-1" disabled>
                  Protégé
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <CardTitle>Gestion des Utilisateurs (Modération)</CardTitle>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Modérateur
              </Badge>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'grid' | 'table')}>
                <TabsList>
                  <TabsTrigger value="grid" className="px-3">
                    <LayoutGrid className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="table" className="px-3">
                    <List className="h-4 w-4" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers.map((user) => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <ScrollArea className="h-[calc(100vh-220px)]">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="min-w-[200px]">Utilisateur</TableHead>
                      <TableHead className="w-[120px]">Rôle</TableHead>
                      <TableHead className="w-[120px]">Statut</TableHead>
                      <TableHead className="w-[250px]">Dernière connexion</TableHead>
                      <TableHead className="text-right w-[200px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => {
                      const canEdit = canModifyOrDelete(user)
                      return (
                        <TableRow key={user.id}>
                          <TableCell className="py-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar className="h-10 w-10 flex-shrink-0">
                                <AvatarImage src={user.photoURL || undefined} alt={user.displayName || ''} />
                                <AvatarFallback>{user.displayName?.[0] || 'U'}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium truncate">{user.displayName || 'Non défini'}</p>
                                </div>
                                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant={user.role === 'super_admin' ? 'default' : 'secondary'}>
                                {user.role || 'citizen'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={user.isActive}
                              onCheckedChange={(checked) => handleStatusChange(user.id, checked)}
                              disabled={!canEdit}
                            />
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {user.lastLogin ? format(user.lastLogin, 'dd MMM yyyy HH:mm', { locale: fr }) : 'N/A'}
                            </span>
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="flex justify-end gap-2">
                              <Select
                                defaultValue={user.role || 'citizen'}
                                onValueChange={(value: UserRole) => handleRoleChange(user.id, value)}
                                disabled={!canEdit}
                              >
                                <SelectTrigger className="w-[140px]" disabled={!canEdit}>
                                  <SelectValue placeholder={canEdit ? "Changer le rôle" : "Protégé"} />
                                </SelectTrigger>
                                <SelectContent>
                                  {['municipal_rep', 'citizen'].map((role) => (
                                    <SelectItem key={role} value={role}>
                                      {role === 'municipal_rep' ? 'Représentant Municipal' : 'Utilisateur'}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {canEdit ? (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm" className="flex-1">
                                      Supprimer
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Cette action est irréversible. L'utilisateur sera définitivement supprimé.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>
                                        Confirmer
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              ) : (
                                <Button variant="outline" size="sm" className="flex-1" disabled>
                                  Protégé
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ModeratorPage 