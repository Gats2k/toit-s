export function Footer() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container py-6 md:py-8">
        <div className="flex flex-col md:grid md:grid-cols-3 gap-8 text-center items-center">
          <div className="flex flex-col items-center w-full">
            <h3 className="font-semibold mb-3">ToiletFinder</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Nous vous aidons à trouver des toilettes accessibles dans votre ville, quand vous en avez besoin.
            </p>
          </div>
          
          <div className="w-full flex flex-col items-center">
            <h3 className="font-semibold mb-3">Liens rapides</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/" className="text-muted-foreground hover:text-foreground transition-colors">Accueil</a></li>
              <li><a href="/search" className="text-muted-foreground hover:text-foreground transition-colors">Recherche</a></li>
              <li><a href="/map" className="text-muted-foreground hover:text-foreground transition-colors">Carte</a></li>
              <li><a href="/about" className="text-muted-foreground hover:text-foreground transition-colors">À propos</a></li>
            </ul>
          </div>
          
          <div className="w-full flex flex-col items-center">
            <h3 className="font-semibold mb-3">Légal</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Politique de confidentialité</a></li>
              <li><a href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">Conditions d&apos;utilisation</a></li>
              <li><a href="/cookies" className="text-muted-foreground hover:text-foreground transition-colors">Politique de cookies</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t">
          <p className="text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} ToiletFinder. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}