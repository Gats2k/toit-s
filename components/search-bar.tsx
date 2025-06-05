"use client"

import { useState } from 'react';
import { Search, X } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function SearchBar({ 
  onSearch, 
  placeholder = "Rechercher des toilettes..." 
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };
  
  const clearSearch = () => {
    setQuery('');
    onSearch('');
  };
  
  return (
    <form onSubmit={handleSearch} className="relative flex w-full items-center">
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pr-16"
      />
      
      {query && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-12 h-full"
          onClick={clearSearch}
        >
          <X size={16} />
          <span className="sr-only">Clear search</span>
        </Button>
      )}
      
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        className="absolute right-0 h-full"
      >
        <Search size={16} />
        <span className="sr-only">Search</span>
      </Button>
    </form>
  );
}