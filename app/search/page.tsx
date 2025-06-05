"use client"

import { useState, useEffect } from 'react';
import { Search, Filter, MapPin } from 'lucide-react';

import { ToiletList } from '@/components/toilet-list';
import { FeatureFilter } from '@/components/feature-filter';
import { SearchBar } from '@/components/search-bar';
import { useGeolocation } from '@/lib/geolocation';
import { mockToilets } from '@/lib/mockData';
import { Toilet, ToiletFeature } from '@/lib/types';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function SearchPage() {
  const { coordinates } = useGeolocation();
  const [toilets, setToilets] = useState<Toilet[]>(mockToilets);
  const [filteredToilets, setFilteredToilets] = useState<Toilet[]>(mockToilets);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState<ToiletFeature[]>([]);

  // Filter toilets when search query or features change
  useEffect(() => {
    let result = [...toilets];
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        toilet => 
          toilet.name.toLowerCase().includes(query) || 
          toilet.address.toLowerCase().includes(query)
      );
    }
    
    // Filter by features
    if (selectedFeatures.length > 0) {
      result = result.filter(toilet => 
        selectedFeatures.every(feature => toilet.features.includes(feature))
      );
    }
    
    setFilteredToilets(result);
  }, [toilets, searchQuery, selectedFeatures]);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Handle feature filter change
  const handleFeatureFilter = (features: ToiletFeature[]) => {
    setSelectedFeatures(features);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight mb-4">Rechercher des toilettes</h1>
      
      <SearchBar 
        onSearch={handleSearch} 
        placeholder="Rechercher par nom ou adresse..." 
      />
      
      <Accordion type="single" collapsible className="mb-6">
        <AccordionItem value="filters">
          <AccordionTrigger className="flex items-center">
            <div className="flex items-center gap-2">
              <Filter size={18} />
              <span>Filtres</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="pt-2">
              <FeatureFilter onFilterChange={handleFeatureFilter} />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <MapPin size={16} />
        {coordinates ? (
          <span>Résultats triés par proximité à votre position</span>
        ) : (
          <span>Activez la localisation pour trier les toilettes par distance</span>
        )}
      </div>
      
      <ToiletList 
        userCoordinates={coordinates}
      />
    </div>
  );
}