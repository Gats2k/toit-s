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
                      className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-0 px-4 py-2"
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
                      className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-0 px-4 py-2"
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

            <Button type="submit" className="w-full bg-black text-white hover:bg-gray-800 rounded-xl py-3" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoginForm ? "Continuer" : "S'inscrire"}
            </Button>
          </form>
        </Form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">
                OU
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full mt-6 gap-2 border-gray-300 rounded-xl py-3 flex items-center justify-center text-base"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <img src="google_icon.png" alt="Google Icon" className="h-5 w-5" />
            Continuer avec Google
          </Button>
          <div className="text-center text-sm text-muted-foreground mt-4">
            {isLoginForm ? "Vous n'avez pas de compte ?" : "Vous avez déjà un compte ?"} {''}
            <Button
              variant="link"
              onClick={toggleAuthForm}
              className="p-0 h-auto text-blue-600 hover:text-blue-700 font-semibold"
              disabled={isLoading}
            >
              {isLoginForm ? "S'inscrire" : "Connexion"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}