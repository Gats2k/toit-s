import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Coordinates, Toilet, ToiletFeature } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateDistance(
  coords1: Coordinates,
  coords2: Coordinates
): number {
  const R = 6371; // Earth's radius in km
  const dLat = degToRad(coords2.latitude - coords1.latitude);
  const dLon = degToRad(coords2.longitude - coords1.longitude);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degToRad(coords1.latitude)) * 
    Math.cos(degToRad(coords2.latitude)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

// Convert degrees to radians
function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Format distance for display
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  }
  return `${distance.toFixed(1)} km`;
}

// Sort toilets by distance from user coordinates
export function sortToiletsByDistance(
  toilets: Toilet[],
  userCoords: Coordinates
): Toilet[] {
  return [...toilets].sort((a, b) => {
    const distA = calculateDistance(userCoords, {
      latitude: a.latitude,
      longitude: a.longitude,
    });
    const distB = calculateDistance(userCoords, {
      latitude: b.latitude,
      longitude: b.longitude,
    });
    return distA - distB;
  });
}

// Filter toilets by features
export function filterToiletsByFeatures(
  toilets: Toilet[],
  features: ToiletFeature[]
): Toilet[] {
  if (features.length === 0) return toilets;
  
  return toilets.filter(toilet => 
    features.every(feature => toilet.features.includes(feature))
  );
}

// Format date for display
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('default', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

// Get feature label for display
export function getFeatureLabel(feature: ToiletFeature): string {
  const labels: Record<ToiletFeature, string> = {
    wheelchair_accessible: 'Wheelchair Accessible',
    baby_changing: 'Baby Changing',
    gender_neutral: 'Gender Neutral',
    free: 'Free',
    requires_key: 'Requires Key',
    '24h': '24 Hours',
  };
  
  return labels[feature] || feature;
}

// Get status color
export function getStatusColor(status: string): string {
  switch (status) {
    case 'available':
      return 'bg-green-500';
    case 'occupied':
      return 'bg-orange-500';
    case 'closed':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
}

// Get feature icon (returns class name for Lucide icon)
export function getFeatureIcon(feature: ToiletFeature): string {
  const icons: Record<ToiletFeature, string> = {
    wheelchair_accessible: 'Wheelchair',
    baby_changing: 'Baby',
    gender_neutral: 'Users',
    free: 'Ticket',
    requires_key: 'Key',
    '24h': 'Clock',
  };
  
  return icons[feature] || 'Info';
}