"use client"

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, MapPin, Search, Map as MapIcon, PlusCircle } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { auth } from '@/firebase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { AuthDialog } from './ui/auth-dialog';


export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [firebaseUser] = useAuthState(auth);
  
  const closeSheet = () => setIsOpen(false);

  const navItems = [
    {
      name: 'Nearby',
      href: '/',
      icon: <MapPin size={18} />,
    },
    {
      name: 'Map',
      href: '/map',
      icon: <MapIcon size={18} />,
    },
  ];

  // Conditional nav items based on authentication
  const authNavItems = user
    ? [
        {
          name: 'Add Toilet',
          href: '/toilets/add',
          icon: <PlusCircle size={18} />,
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

  // Add admin option if user is admin (you can customize this based on your role system)
  if (user?.email?.endsWith('@admin.com')) { // Example condition for admin
    authNavItems.push({
      name: 'Admin',
      href: '/admin',
      icon: <PlusCircle size={18} />,
    });
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-4xl mx-auto flex h-14 items-center px-2 sm:px-4">
        <Link href="/" className="mr-4 flex items-center space-x-2">
          <MapPin className="h-6 w-6" />
          <span className="font-bold">ToiletFinder</span>
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
                <Button variant="outline" onClick={logout}>
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => useAuthStore.getState().setAuthDialogOpen(true)}
                >
                  Log in
                </Button>
                <Button 
                  onClick={() => {
                    useAuthStore.getState().setAuthDialogOpen(true)
                    useAuthStore.getState().toggleAuthForm()
                  }}
                >
                  Sign up
                </Button>
              </>
            )}
          </nav>

          <ThemeToggle />

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
                <span className="font-bold">ToiletFinder</span>
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
                        useAuthStore.getState().setAuthDialogOpen(true)
                        useAuthStore.getState().toggleAuthForm()
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