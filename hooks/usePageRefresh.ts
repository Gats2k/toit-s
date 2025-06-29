import { useCallback } from 'react'

/**
 * Hook personnalisé pour actualiser la page
 * @returns Fonction pour actualiser la page
 */
export const usePageRefresh = () => {
  const refreshPage = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }, [])

  return refreshPage
} 