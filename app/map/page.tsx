"use client"

import { useState, useEffect } from 'react';
import { Map as MapIcon, Loader, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import "leaflet/dist/leaflet.css";
import dynamic from 'next/dynamic'; 

import { LoadingSpinner } from '@/components/loading-spinner';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FeatureFilter } from '@/components/feature-filter';
import { SearchBar } from '@/components/search-bar';

import { useGeolocation } from '@/lib/geolocation';
import { mockToilets } from '@/lib/mockData';
import { Toilet, ToiletFeature } from '@/lib/types';

// Dynamically import the Map component to avoid SSR issues with Leaflet
const DynamicMap = dynamic(() => import('@/components/map-component'), {
  ssr: false,
  loading: () => <LoadingSpinner text="Loading map..." />,
});

export default function MapPage() {
  const { coordinates, error, loading } = useGeolocation();
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
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight mb-4 text-center md:text-left">Vue Carte</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="md:col-span-2">
          <SearchBar onSearch={handleSearch} placeholder="Rechercher par nom ou adresse..." />
        </div>
        <div className="mt-2 md:mt-0">
          <FeatureFilter onFilterChange={handleFeatureFilter} />
        </div>
      </div>
      
      <div className="rounded-lg border overflow-hidden min-h-[350px] md:min-h-[500px] relative">
        {loading ? (
          <div className="flex items-center justify-center h-[500px]">
            <LoadingSpinner text="Obtention de votre position..." />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-[500px]">
            <Alert>
              <MapPin className="h-4 w-4" />
              <AlertDescription>
                Impossible d&apos;accéder à votre position. La carte affichera une zone par défaut.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <DynamicMap 
            toilets={filteredToilets} 
            userCoordinates={coordinates}
          />
        )}
      </div>
      
      <div className="text-sm text-muted-foreground text-center md:text-left">
        <p>
          Affichage de {filteredToilets.length} toilettes sur {toilets.length}
          {searchQuery && ` correspondant à "${searchQuery}"`}
          {selectedFeatures.length > 0 && ` avec les filtres sélectionnés`}
        </p>
      </div>
    </div>
  );
}