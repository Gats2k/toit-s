"use client"

import { AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface LocationErrorProps {
  error: {
    code: number;
    message?: string;
  };
  onRetry: () => void;
}

export function LocationErrorDisplay({ error, onRetry }: LocationErrorProps) {
  // Get error message based on error code
  const getErrorMessage = () => {
    switch (error.code) {
      case 1:
        return "You've denied permission to access your location. Please enable location services to find toilets near you.";
      case 2:
        return "We couldn't determine your location. Please try again or use the search feature instead.";
      case 3:
        return "Location request timed out. Please try again.";
      default:
        return error.message || "An unknown error occurred. Please try again.";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Location Error</AlertTitle>
        <AlertDescription>
          {getErrorMessage()}
        </AlertDescription>
        <div className="mt-4">
          <Button 
            variant="outline" 
            onClick={onRetry}
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Try Again
          </Button>
        </div>
      </Alert>
    </motion.div>
  );
}