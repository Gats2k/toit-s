export function Footer() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container py-6 md:py-8">
          <p className="text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} ToiletFinder. Tous droits réservés.
          </p>
      </div>
    </footer>
  );
}