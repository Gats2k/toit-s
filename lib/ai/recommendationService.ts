import { AIRecommendation, UserPreferences, UserHistory, Toilet, GeoPoint, GeoQuery } from './types';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/firebase/client';

export class AIRecommendationService {
  private static instance: AIRecommendationService;

  private constructor() {}

  public static getInstance(): AIRecommendationService {
    if (!AIRecommendationService.instance) {
      AIRecommendationService.instance = new AIRecommendationService();
    }
    return AIRecommendationService.instance;
  }

  async getPersonalizedRecommendations(
    userId: string,
    preferences: UserPreferences,
    location: GeoPoint
  ): Promise<AIRecommendation[]> {
    try {
      const userHistory = await this.getUserHistory(userId);
      const nearbyToilets = await this.getNearbyToilets({ center: location, radius: 2000 }); // 2km par défaut

      return nearbyToilets
        .map(toilet => this.calculateToiletScore(toilet, preferences, userHistory))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
    } catch (error) {
      console.error('Erreur lors de la génération des recommandations:', error);
      throw error;
    }
  }

  private async getUserHistory(userId: string): Promise<UserHistory[]> {
    const historyRef = collection(db, 'userHistory');
    const q = query(
      historyRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        userId: data.userId,
        toiletId: data.toiletId,
        timestamp: data.timestamp.toDate(),
        rating: data.rating,
        comment: data.comment,
        visited: data.visited
      };
    });
  }

  private async getNearbyToilets(geoQuery: GeoQuery): Promise<Toilet[]> {
    const toiletsRef = collection(db, 'toilets');
    
    // Calculer la boîte englobante pour la requête
    const bounds = this.calculateBoundingBox(geoQuery.center, geoQuery.radius);
    
    // Requête pour les toilettes dans la boîte englobante
    const q = query(
      toiletsRef,
      where('location.lat', '>=', bounds.minLat),
      where('location.lat', '<=', bounds.maxLat),
      where('location.lng', '>=', bounds.minLng),
      where('location.lng', '<=', bounds.maxLng),
      limit(50)
    );

    const snapshot = await getDocs(q);
    const toilets = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: data.id,
        name: data.name,
        area: data.area,
        location: data.location,
        isAccessible: data.isAccessible,
        cleanliness: data.cleanliness,
        busyness: data.busyness,
        amenities: data.amenities,
        status: data.status,
        lastUpdated: data.lastUpdated.toDate()
      } as Toilet;
    });

    // Filtrer les résultats pour ne garder que ceux dans le rayon exact
    return toilets.filter(toilet => 
      this.calculateDistance(geoQuery.center, toilet.location) <= geoQuery.radius
    );
  }

  private calculateBoundingBox(center: GeoPoint, radius: number): {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  } {
    const earthRadius = 6371000; // Rayon de la Terre en mètres
    const lat = center.lat * Math.PI / 180;
    const lng = center.lng * Math.PI / 180;
    const angularDistance = radius / earthRadius;

    return {
      minLat: (lat - angularDistance) * 180 / Math.PI,
      maxLat: (lat + angularDistance) * 180 / Math.PI,
      minLng: (lng - angularDistance / Math.cos(lat)) * 180 / Math.PI,
      maxLng: (lng + angularDistance / Math.cos(lat)) * 180 / Math.PI
    };
  }

  private calculateDistance(point1: GeoPoint, point2: GeoPoint): number {
    const earthRadius = 6371000; // Rayon de la Terre en mètres
    const lat1 = point1.lat * Math.PI / 180;
    const lat2 = point2.lat * Math.PI / 180;
    const deltaLat = (point2.lat - point1.lat) * Math.PI / 180;
    const deltaLng = (point2.lng - point1.lng) * Math.PI / 180;

    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return earthRadius * c;
  }

  private calculateToiletScore(
    toilet: Toilet,
    preferences: UserPreferences,
    userHistory: UserHistory[]
  ): AIRecommendation {
    const reasons: string[] = [];
    let score = 0.5; // Score de base

    // Vérifier l'accessibilité
    if (preferences.accessibility && toilet.isAccessible) {
      score += 0.2;
      reasons.push('Accessible aux personnes à mobilité réduite');
    }

    // Vérifier la propreté
    if (toilet.cleanliness >= preferences.cleanliness / 5) {
      score += 0.2;
      reasons.push('Niveau de propreté conforme à vos attentes');
    }

    // Vérifier les équipements
    const matchingAmenities = preferences.amenities.filter(amenity =>
      toilet.amenities.includes(amenity)
    );
    if (matchingAmenities.length > 0) {
      score += 0.1 * matchingAmenities.length;
      reasons.push(`Équipements disponibles : ${matchingAmenities.join(', ')}`);
    }

    // Vérifier l'historique utilisateur
    const userRatings = userHistory
      .filter(h => h.toiletId === toilet.id && h.rating)
      .map(h => h.rating as number);
    if (userRatings.length > 0) {
      const avgRating = userRatings.reduce((a, b) => a + b, 0) / userRatings.length;
      score += avgRating * 0.1;
      reasons.push('Basé sur vos expériences précédentes');
    }

    // Vérifier la localisation préférée
    if (preferences.preferredLocations.includes(toilet.area)) {
      score += 0.2;
      reasons.push('Dans une zone que vous préférez');
    }

    // Normaliser le score entre 0 et 1
    score = Math.min(1, Math.max(0, score));

    return {
      toiletId: toilet.id,
      score,
      reasons,
      accessibilityScore: toilet.isAccessible ? 1 : 0,
      cleanlinessScore: toilet.cleanliness,
      busynessScore: toilet.busyness
    };
  }

  async getSimilarToilets(toiletId: string): Promise<AIRecommendation[]> {
    try {
      const toiletRef = collection(db, 'toilets');
      const toiletDoc = await getDocs(query(toiletRef, where('id', '==', toiletId)));
      const toilet = toiletDoc.docs[0]?.data() as Toilet;

      if (!toilet) {
        throw new Error('Toilette non trouvée');
      }

      const allToilets = await getDocs(toiletRef);
      const similarToilets = allToilets.docs
        .map(doc => doc.data() as Toilet)
        .filter(t => t.id !== toiletId)
        .map(t => this.calculateSimilarityScore(t, toilet))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      return similarToilets;
    } catch (error) {
      console.error('Erreur lors de la recherche de toilettes similaires:', error);
      throw error;
    }
  }

  private calculateSimilarityScore(toilet: Toilet, reference: Toilet): AIRecommendation {
    const reasons: string[] = [];
    let score = 0.5;

    // Comparer les équipements
    const commonAmenities = toilet.amenities.filter(a =>
      reference.amenities.includes(a)
    );
    if (commonAmenities.length > 0) {
      score += 0.2;
      reasons.push(`Mêmes équipements : ${commonAmenities.join(', ')}`);
    }

    // Comparer le niveau de propreté
    if (Math.abs(toilet.cleanliness - reference.cleanliness) < 0.2) {
      score += 0.2;
      reasons.push('Niveau de propreté similaire');
    }

    // Comparer l'accessibilité
    if (toilet.isAccessible === reference.isAccessible) {
      score += 0.1;
      reasons.push('Même niveau d\'accessibilité');
    }

    // Comparer la zone
    if (toilet.area === reference.area) {
      score += 0.2;
      reasons.push('Même zone');
    }

    return {
      toiletId: toilet.id,
      score,
      reasons,
      accessibilityScore: toilet.isAccessible ? 1 : 0,
      cleanlinessScore: toilet.cleanliness,
      busynessScore: toilet.busyness
    };
  }
} 