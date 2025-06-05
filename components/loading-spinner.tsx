"use client"

import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
}

export function LoadingSpinner({ 
  size = 'medium', 
  text = 'Chargement...' 
}: LoadingSpinnerProps) {
  // Define spinner size based on prop
  const spinnerSize = {
    small: 'w-5 h-5',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
  }[size];

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <motion.div
        className={`${spinnerSize} border-4 border-primary border-opacity-20 rounded-full`}
        style={{ borderTopColor: 'hsl(var(--primary))' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      {text && (
        <p className="mt-4 text-sm text-muted-foreground">{text}</p>
      )}
    </div>
  );
}