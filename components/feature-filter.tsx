"use client"

import { useState } from 'react';
import { FilterX } from 'lucide-react';
import { Armchair as Wheelchair, Baby, Users, Ticket, Key, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ToiletFeature } from '@/lib/types';

interface FeatureFilterProps {
  onFilterChange: (features: ToiletFeature[]) => void;
}

export function FeatureFilter({ onFilterChange }: FeatureFilterProps) {
  const [selectedFeatures, setSelectedFeatures] = useState<ToiletFeature[]>([]);
  
  const featureOptions: { value: ToiletFeature; label: string; icon: JSX.Element }[] = [
    { value: 'wheelchair_accessible', label: 'Accès fauteuil roulant', icon: <Wheelchair size={16} /> },
    { value: 'baby_changing', label: 'Table à langer', icon: <Baby size={16} /> },
    { value: 'gender_neutral', label: 'Non genré', icon: <Users size={16} /> },
    { value: 'free', label: 'Gratuit', icon: <Ticket size={16} /> },
    { value: 'requires_key', label: 'Clé requise', icon: <Key size={16} /> },
    { value: '24h', label: 'Ouvert 24h/24', icon: <Clock size={16} /> },
  ];
  
  const toggleFeature = (feature: ToiletFeature) => {
    const newFeatures = selectedFeatures.includes(feature)
      ? selectedFeatures.filter(f => f !== feature)
      : [...selectedFeatures, feature];
    
    setSelectedFeatures(newFeatures);
    onFilterChange(newFeatures);
  };
  
  const clearFilters = () => {
    setSelectedFeatures([]);
    onFilterChange([]);
  };
  
  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h3 className="text-sm font-medium">Filtrer par équipements</h3>
        {selectedFeatures.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className="h-8 px-2 text-xs"
          >
            <FilterX size={14} className="mr-1" />
            Effacer les filtres
          </Button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
        {featureOptions.map((feature) => (
          <TooltipProvider key={feature.value}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant={selectedFeatures.includes(feature.value) ? "default" : "outline"}
                  className={`cursor-pointer transition-colors ${
                    selectedFeatures.includes(feature.value) 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-secondary"
                  }`}
                  onClick={() => toggleFeature(feature.value)}
                >
                  {feature.icon}
                  <span className="ml-1 hidden sm:inline">{feature.label}</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{feature.label}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  );
}