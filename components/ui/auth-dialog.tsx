"use client"

import React from 'react'
import { useForm } from 'react-hook-form'
import { 
  useSignInWithEmailAndPassword, 
  useSignInWithGoogle,
  useCreateUserWithEmailAndPassword,
  useAuthState
} from 'react-firebase-hooks/auth'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { auth } from '@/firebase/client'
import { useAuthStore } from '@/store/useAuthStore'
import { 
  Form, 
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage 
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const formSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
})

export function AuthDialog() {
  const { 
    isLoginForm, 
    toggleAuthForm, 
    isLoading, 
    setLoading,
    setUser,
    isAuthDialogOpen,
    setAuthDialogOpen
  } = useAuthStore()

  const [user] = useAuthState(auth)

  React.useEffect(() => {
    if (user) {
      setUser(user)
    }
  }, [user, setUser])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const [
    signInWithEmailAndPassword,
    ,
    signInLoading,
    signInError,
  ] = useSignInWithEmailAndPassword(auth)

  const [
    createUserWithEmailAndPassword,
    ,
    signUpLoading,
    signUpError,
  ] = useCreateUserWithEmailAndPassword(auth)

  const [
    signInWithGoogle,
    ,
    googleLoading,
    googleError,
  ] = useSignInWithGoogle(auth)

  React.useEffect(() => {
    setLoading(signInLoading || signUpLoading || googleLoading)
  }, [signInLoading, signUpLoading, googleLoading, setLoading])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (isLoginForm) {
        const userCredential = await signInWithEmailAndPassword(values.email, values.password)
        if (userCredential) {
          setUser(userCredential.user)
          setAuthDialogOpen(false)
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(values.email, values.password)
        if (userCredential) {
          setUser(userCredential.user)
          setAuthDialogOpen(false)
        }
      }
    } catch (error) {
      console.error("Authentication error:", error)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      const userCredential = await signInWithGoogle()
      if (userCredential) {
        setUser(userCredential.user)
        setAuthDialogOpen(false)
      }
    } catch (error) {
      console.error("Google sign in error:", error)
    }
  }

  return (
    <Dialog open={isAuthDialogOpen} onOpenChange={setAuthDialogOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">
            {isLoginForm ? "Connexion" : "Inscription"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="email@exemple.com" 
                      {...field} 
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mot de passe</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="••••••" 
                      {...field} 
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {(signInError || signUpError) && (
              <div className="text-sm font-medium text-destructive">
                {signInError?.message || signUpError?.message}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoginForm ? "Se connecter" : "S'inscrire"}
            </Button>
          </form>
        </Form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                OU CONTINUER AVEC
              </span>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full mt-6 gap-2"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 48 48">
                <g>
                  <path fill="#4285F4" d="M44.5 20H24v8.5h11.7C34.1 33.1 29.7 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c2.7 0 5.2.9 7.2 2.4l6.4-6.4C34.1 5.1 29.3 3 24 3 12.9 3 4 11.9 4 23s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.2-4z"/>
                  <path fill="#34A853" d="M6.3 14.7l7 5.1C15.1 17.1 19.2 14 24 14c2.7 0 5.2.9 7.2 2.4l6.4-6.4C34.1 5.1 29.3 3 24 3c-7.2 0-13.3 4.1-16.7 10.1z"/>
                  <path fill="#FBBC05" d="M24 44c5.7 0 10.5-1.9 14.1-5.1l-6.5-5.3C29.7 36 24 36 24 36c-5.7 0-10.5-1.9-14.1-5.1l6.5-5.3C18.3 32.9 21.9 34 24 34z"/>
                  <path fill="#EA4335" d="M44.5 20H24v8.5h11.7C34.1 33.1 29.7 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c2.7 0 5.2.9 7.2 2.4l6.4-6.4C34.1 5.1 29.3 3 24 3 12.9 3 4 11.9 4 23s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.2-4z"/>
                </g>
              </svg>
            )}
            Google
          </Button>

          {googleError && (
            <div className="mt-2 text-sm font-medium text-destructive">
              {googleError.message}
            </div>
          )}

          <div className="mt-4 text-center text-sm">
            {isLoginForm ? "Pas encore de compte ?" : "Déjà un compte ?"}{" "}
            <Button 
              variant="link" 
              className="p-0 h-auto" 
              onClick={toggleAuthForm}
              disabled={isLoading}
            >
              {isLoginForm ? "Créer un compte" : "Se connecter"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}