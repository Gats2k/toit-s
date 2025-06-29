export interface AIRecommendation {
  toiletId: string;
  score: number;
  reasons: string[];
  accessibilityScore?: number;
  cleanlinessScore?: number;
  busynessScore?: number;
}

export interface UserPreferences {
  accessibility: boolean;
  cleanliness: number; // 1-5
  amenities: string[];
  preferredLocations: string[];
  medicalNeeds?: string[];
}

export interface SentimentAnalysis {
  score: number; // -1 to 1
  isToxic: boolean;
  isSpam: boolean;
  confidence: number;
}

export interface ToiletPrediction {
  toiletId: string;
  predictedStatus: 'available' | 'busy' | 'maintenance';
  busyness: number;
  maintenanceNeeds: MaintenanceAlert[];
  confidence: number;
  timestamp: Date;
}

export interface MaintenanceAlert {
  type: 'cleanliness' | 'maintenance';
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: Date;
}

export interface UserContribution {
  userId: string;
  type: 'review' | 'photo' | 'report';
  toiletId: string;
  timestamp: Date;
  verified: boolean;
  impact: number;
}

export interface UrbanAnalysis {
  areaId: string;
  toiletDensity: number;
  demandScore: number;
  seasonalFactors: {
    [key: string]: number;
  };
  eventImpact: {
    [eventId: string]: number;
  };
}

export interface ImageAnalysis {
  cleanliness: number;
  hasPaper: boolean;
  hasSoap: boolean;
  hasHandDryer: boolean;
  isAccessible: boolean;
  confidence: number;
}

// Types pour les résultats de l'API Hugging Face
export interface HuggingFaceClassification {
  label: string;
  score: number;
}

export interface HuggingFaceDetection {
  label: string;
  score: number;
  box: {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
  };
}

// Types pour les données historiques
export interface HistoricalData {
  toiletId: string;
  status: string;
  busyness: number;
  cleanliness: number;
  timestamp: Date;
}

export interface MaintenanceReport {
  toiletId: string;
  issue: string;
  severity: 'low' | 'medium' | 'high';
  status: 'pending' | 'resolved';
  timestamp: Date;
}

export interface UserHistory {
  userId: string;
  toiletId: string;
  timestamp: number;
  rating?: number;
  comment?: string;
  visited: boolean;
}

export interface Toilet {
  id: string;
  name: string;
  area: string;
  location: {
    lat: number;
    lng: number;
  };
  isAccessible: boolean;
  cleanliness: number;
  busyness: number;
  amenities: string[];
  status: 'available' | 'busy' | 'maintenance';
  lastUpdated: Date;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface GeoQuery {
  center: GeoPoint;
  radius: number; // en mètres
} 