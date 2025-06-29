import { useState, useCallback } from 'react';
import { AIRecommendationService } from '../lib/ai/recommendationService';
import { SentimentAnalysisService } from '../lib/ai/sentimentAnalysisService';
import { PredictionService } from '../lib/ai/predictionService';
import { ImageAnalysisService } from '../lib/ai/imageAnalysisService';
import { 
  AIRecommendation, 
  UserPreferences, 
  ToiletPrediction, 
  MaintenanceAlert,
  ImageAnalysis,
  SentimentAnalysis
} from '../lib/ai/types';

export const useAI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRecommendations = useCallback(async (
    userId: string,
    preferences: UserPreferences,
    location: { lat: number; lng: number },
    radius: number
  ): Promise<AIRecommendation[]> => {
    setLoading(true);
    setError(null);
    try {
      const service = AIRecommendationService.getInstance();
      const recommendations = await service.getPersonalizedRecommendations(
        userId,
        preferences,
        location,
        radius
      );
      return recommendations;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const analyzeComment = useCallback(async (comment: string): Promise<SentimentAnalysis> => {
    setLoading(true);
    setError(null);
    try {
      const service = SentimentAnalysisService.getInstance();
      const analysis = await service.analyzeComment(comment);
      return analysis;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      return {
        score: 0,
        isPositive: false,
        isNegative: false,
        isSpam: false,
        confidence: 0
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const predictToiletStatus = useCallback(async (toiletId: string): Promise<ToiletPrediction> => {
    setLoading(true);
    setError(null);
    try {
      const service = PredictionService.getInstance();
      const prediction = await service.predictToiletStatus(toiletId);
      return prediction;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      return {
        toiletId,
        expectedWaitTime: 0,
        expectedCleanliness: 0,
        busynessPrediction: 0
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const analyzeImage = useCallback(async (imageUrl: string): Promise<ImageAnalysis> => {
    setLoading(true);
    setError(null);
    try {
      const service = ImageAnalysisService.getInstance();
      const analysis = await service.analyzeToiletImage(imageUrl);
      return analysis;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      return {
        cleanliness: 0,
        hasPaper: false,
        hasSoap: false,
        hasHandDryer: false,
        isAccessible: false,
        confidence: 0
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const getMaintenanceAlerts = useCallback(async (toiletId: string): Promise<MaintenanceAlert[]> => {
    setLoading(true);
    setError(null);
    try {
      const service = PredictionService.getInstance();
      const alerts = await service.analyzeMaintenanceNeeds(toiletId);
      return alerts;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getRecommendations,
    analyzeComment,
    predictToiletStatus,
    analyzeImage,
    getMaintenanceAlerts
  };
}; 