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
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-8">
          <h1 className="text-3xl font-bold">Toilettes publiques</h1>
          
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <SearchBar onSearch={handleSearch} />
            <FeatureFilter onFilterChange={handleFeatureFilter} />
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <LocationErrorDisplay error={error} onRetry={getLocation} />
        ) : (
          <ToiletList 
            toilets={filteredToilets}
            userCoordinates={coordinates}
            searchQuery={searchQuery}
            filters={{
              features: selectedFeatures,
            }}
          />
        )}
      </div>
    </main>
  );
}