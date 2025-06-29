import { useEffect, useState } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    // Vérifier si window est défini (pour éviter les erreurs SSR)
    if (typeof window === 'undefined') return

    // Créer un MediaQueryList
    const mediaQuery = window.matchMedia(query)

    // Définir la valeur initiale
    setMatches(mediaQuery.matches)

    // Fonction de callback pour mettre à jour l'état
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Ajouter l'écouteur d'événements
    mediaQuery.addEventListener('change', handleChange)

    // Nettoyer l'écouteur d'événements lors du démontage
    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [query]) // Réexécuter l'effet si la requête change

  return matches
} 