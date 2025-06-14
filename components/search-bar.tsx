"use client"

import { useState, useEffect } from 'react';
import { Search, X, Mic, MicOff, AlertCircle } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function SearchBar({ 
  onSearch, 
  placeholder = "Rechercher des toilettes..." 
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'fr-FR';
        
        recognition.onstart = () => {
          setIsListening(true);
          setError(null);
        };
        
        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setIsTranscribing(true);
          setQuery(transcript);
          
          if (event.results[0].isFinal) {
            onSearch(transcript);
            setIsTranscribing(false);
          }
        };
        
        recognition.onend = () => {
          setIsListening(false);
          setIsTranscribing(false);
        };
        
        recognition.onerror = (event) => {
          console.error('Erreur de reconnaissance vocale:', event.error);
          setIsListening(false);
          setIsTranscribing(false);
          
          switch (event.error) {
            case 'not-allowed':
              setError('L\'accès au microphone a été refusé. Veuillez autoriser l\'accès dans les paramètres de votre navigateur.');
              break;
            case 'no-speech':
              setError('Aucune parole n\'a été détectée. Veuillez réessayer.');
              break;
            case 'audio-capture':
              setError('Aucun microphone n\'a été détecté. Veuillez vérifier votre matériel.');
              break;
            case 'network':
              setError('Erreur réseau. Veuillez vérifier votre connexion internet.');
              break;
            default:
              setError('Une erreur est survenue lors de la reconnaissance vocale.');
          }
        };
        
        setRecognition(recognition);
      } else {
        setError('La reconnaissance vocale n\'est pas supportée par votre navigateur.');
      }
    }
  }, [onSearch]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };
  
  const clearSearch = () => {
    setQuery('');
    onSearch('');
    setError(null);
  };

  const toggleListening = () => {
    if (!recognition) return;
    
    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (error) {
        setError('Impossible de démarrer la reconnaissance vocale. Veuillez réessayer.');
      }
    }
  };
  
  return (
    <div className="w-full space-y-2">
      <form onSubmit={handleSearch} className="relative flex w-full items-center">
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={`pr-24 transition-all duration-200 ${isTranscribing ? 'bg-blue-50' : ''}`}
        />
        
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-20 h-full"
            onClick={clearSearch}
          >
            <X size={16} />
            <span className="sr-only">Effacer la recherche</span>
          </Button>
        )}
        
        {recognition && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={`absolute right-12 h-full transition-colors duration-200 ${
              isListening ? 'text-red-500 hover:text-red-600' : ''
            }`}
            onClick={toggleListening}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            <span className="sr-only">
              {isListening ? 'Arrêter la reconnaissance vocale' : 'Démarrer la reconnaissance vocale'}
            </span>
          </Button>
        )}
        
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          className="absolute right-0 h-full"
        >
          <Search size={16} />
          <span className="sr-only">Rechercher</span>
        </Button>
      </form>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {isListening && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute right-12 top-12 flex items-center gap-2 text-sm text-muted-foreground"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="h-2 w-2 rounded-full bg-red-500"
          />
          Écoute en cours...
        </motion.div>
      )}
    </div>
  );
}