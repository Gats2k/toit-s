"use client"

import { useState, useEffect } from 'react';
import { MapPin, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

import { ToiletList } from '@/components/toilet-list';
import { FeatureFilter } from '@/components/feature-filter';
import { SearchBar } from '@/components/search-bar';
import { LoadingSpinner } from '@/components/loading-spinner';
import { LocationErrorDisplay } from '@/components/location-error';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { useGeolocation } from '@/lib/geolocation';
import { mockToilets } from '@/lib/mockData';
import { Toilet, ToiletFeature } from '@/lib/types';

export default function Home() {
  const { coordinates, error, loading, getLocation } = useGeolocation();
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
    
    setFilteredToilets(result);
  }, [toilets, searchQuery]);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Handle feature filter
  const handleFeatureFilter = (features: ToiletFeature[]) => {
    setSelectedFeatures(features);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold tracking-tight mb-4 text-center md:text-left">Trouvez des toilettes près de vous</h1>
        
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3 ">
          <div className="md:col-span-2">
            <SearchBar onSearch={handleSearch} placeholder="Rechercher par nom ou adresse..." />
          </div>
          <div className="flex items-center mt-2 md:mt-0">
            <Button 
              onClick={getLocation} 
              variant="outline" 
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <LoadingSpinner size="small" text="" />
              ) : (
                <>
                  <RefreshCw size={16} className="mr-2" />
                  Actualiser la localisation
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
      
      <div className="space-y-6">
        {loading ? (
          <LoadingSpinner text="Obtention de votre position..." />
        ) : error ? (
          <LocationErrorDisplay error={error} onRetry={getLocation} />
        ) : !coordinates ? (
          <Alert>
            <MapPin className="h-4 w-4" />
            <AlertDescription>
              Veuillez autoriser l&apos;accès à la localisation pour trouver des toilettes près de vous.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <FeatureFilter onFilterChange={handleFeatureFilter} />
            <ToiletList 
              userCoordinates={coordinates}
            />
          </>
        )}
      </div>
    </>
  );
}