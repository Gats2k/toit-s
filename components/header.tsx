"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, MapPin, Search, Map as MapIcon, PlusCircle, Shield } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { auth, db } from '@/firebase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { AuthDialog } from './ui/auth-dialog';
import { AddToiletForm } from './add-toilet-form';
import { toast } from 'sonner';
import { SUPER_ADMIN_EMAIL, isSuperAdmin } from '@/lib/roles';

type UserRole = "super_admin" | "moderator" | "municipal_rep" | "citizen" | null;

interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  isActive: boolean;
  photoURL: string | null;
  createdAt: Date | null;
  lastLogin: Date | null;
}

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [firebaseUser] = useAuthState(auth);
  const [userData, setUserData] = useState<UserData | null>(null);
  
  const closeSheet = () => setIsOpen(false);

  useEffect(() => {
    const handleUserData = async (currentUser: any) => {
      if (currentUser) {
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData({
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              role: data.role || null,
              isActive: data.isActive ?? false,
              createdAt: data.createdAt?.toDate() || null,
              lastLogin: data.lastLogin?.toDate() || null,
            });
          } else {
            // Create new user document if it doesn't exist
            const isSuperAdmin = currentUser.email === SUPER_ADMIN_EMAIL;
            const newUserData = {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              role: isSuperAdmin ? 'super_admin' as UserRole : 'citizen' as UserRole,
              isActive: true,
              createdAt: new Date(),
              lastLogin: new Date(),
            };
            
            await setDoc(userDocRef, newUserData);
            setUserData(newUserData);
            toast.success(isSuperAdmin ? 'Compte Super Admin créé avec succès !' : 'Compte créé avec succès !');
          }
        } catch (error) {
          console.error("Error handling user data:", error);
          toast.error('Erreur lors de la création du compte');
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
    };

    if (firebaseUser) {
      handleUserData(firebaseUser);
    }
  }, [firebaseUser]);

  const navItems = [
    // {
    //   name: 'Nearby',
    //   href: '/',
    //   icon: <MapPin size={18} />,
    // },
     {
       name: 'Map',
       href: '/map',
       icon: <MapIcon size={18} />,
     },
     ...(
       isSuperAdmin(userData?.email || firebaseUser?.email)
         ? [{
             name: 'Admin',
             href: '/admin',
             icon: <Shield size={18} />,
           }]
         : userData?.role === 'moderator'
           ? [{
               name: 'Modération',
               href: '/moderator',
               icon: <Shield size={18} />,
             }]
           : []
     ),
  ];

  // Conditional nav items based on authentication
  const authNavItems = user
    ? [
        {
          name: 'Add Toilet',
          component: <AddToiletForm variant="link" className="text-sm font-medium transition-colors hover:text-primary flex items-center text-muted-foreground" />,
        },
        {
          name: 'Profile',
          href: '/profile',
          icon: (
            <Avatar className="h-5 w-5">
              <AvatarImage src={user.photoURL || undefined} />
              <AvatarFallback>
                {user.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ),
        },
      ]
    : [];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-4xl mx-auto flex h-14 items-center px-2 sm:px-4">
        <Link href="/" className="mr-4 flex items-center space-x-2">
          <MapPin className="h-6 w-6" />
          <span className="font-bold">Toit&apos;s Map</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-4 lg:space-x-6 mx-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors hover:text-primary flex items-center ${
                pathname === item.href
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              {item.icon}
              <span className="ml-1">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end space-x-2 sm:space-x-4">
          <nav className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                {authNavItems.map((item) => (
                  item.component ? (
                    <div key={item.name}>
                      {item.component}
                    </div>
                  ) : (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`text-sm font-medium transition-colors hover:text-primary flex items-center ${
                        pathname === item.href
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {item.icon}
                      <span className="ml-1">{item.name}</span>
                    </Link>
                  )
                ))}
                <Button variant="outline" onClick={logout}>
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    useAuthStore.getState().setIsLoginForm(true)
                    useAuthStore.getState().setAuthDialogOpen(true)
                  }}
                >
                  Log in
                </Button>
                <Button 
                  onClick={() => {
                    useAuthStore.getState().setIsLoginForm(false)
                    useAuthStore.getState().setAuthDialogOpen(true)
                  }}
                >
                  Sign up
                </Button>
              </>
            )}
          </nav>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 max-w-full">
              <Link href="/" className="flex items-center space-x-2" onClick={closeSheet}>
                <MapPin className="h-6 w-6" />
                <span className="font-bold">Toit'sMap</span>
              </Link>
              <nav className="mt-8 flex flex-col space-y-3">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center py-2 text-sm font-medium transition-colors hover:text-primary ${
                      pathname === item.href
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    }`}
                    onClick={closeSheet}
                  >
                    {item.icon}
                    <span className="ml-2">{item.name}</span>
                  </Link>
                ))}
                <div className="my-2 h-px bg-border" />
                {user ? (
                  <>
                    {authNavItems.map((item) => (
                      item.component ? (
                        <div key={item.name} onClick={closeSheet}>
                          {item.component}
                        </div>
                      ) : (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center py-2 text-sm font-medium transition-colors hover:text-primary ${
                            pathname === item.href
                              ? 'text-foreground'
                              : 'text-muted-foreground'
                          }`}
                          onClick={closeSheet}
                        >
                          {item.icon}
                          <span className="ml-2">{item.name}</span>
                        </Link>
                      )
                    ))}
                    <button
                      onClick={() => {
                        logout()
                        closeSheet()
                      }}
                      className="flex items-center py-2 text-sm font-medium text-destructive hover:text-destructive/80"
                    >
                      <X size={18} />
                      <span className="ml-2">Log out</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        useAuthStore.getState().setIsLoginForm(true)
                        useAuthStore.getState().setAuthDialogOpen(true)
                        closeSheet()
                      }}
                      className="flex items-center py-2 text-sm font-medium transition-colors hover:text-primary"
                    >
                      <PlusCircle size={18} />
                      <span className="ml-2">Log in</span>
                    </button>
                    <button
                      onClick={() => {
                        useAuthStore.getState().setIsLoginForm(false)
                        useAuthStore.getState().setAuthDialogOpen(true)
                        closeSheet()
                      }}
                      className="flex items-center py-2 text-sm font-medium transition-colors hover:text-primary"
                    >
                      <PlusCircle size={18} />
                      <span className="ml-2">Sign up</span>
                    </button>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <AuthDialog />
    </header>
  );
}