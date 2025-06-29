import { AIRecommendationService } from '../recommendationService';
import { SentimentAnalysisService } from '../sentimentAnalysisService';
import { ImageAnalysisService } from '../imageAnalysisService';
import { PredictionService } from '../predictionService';

describe('AI Services Tests', () => {
  // Test du service de recommandation
  describe('RecommendationService', () => {
    const recommendationService = AIRecommendationService.getInstance();

    it('should return personalized recommendations', async () => {
      const recommendations = await recommendationService.getPersonalizedRecommendations(
        'test-user-id',
        {
          accessibility: true,
          cleanliness: 4,
          amenities: ['paper', 'soap'],
          preferredLocations: ['downtown']
        },
        { lat: 48.8566, lng: 2.3522 } // Paris
      );

      console.log('Recommandations:', recommendations);
      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeLessThanOrEqual(5);
    });

    it('should find similar toilets', async () => {
      const similarToilets = await recommendationService.getSimilarToilets('test-toilet-id');
      
      console.log('Toilettes similaires:', similarToilets);
      expect(similarToilets).toBeDefined();
      expect(Array.isArray(similarToilets)).toBe(true);
      expect(similarToilets.length).toBeLessThanOrEqual(5);
    });
  });

  // Test du service d'analyse de sentiment
  describe('SentimentAnalysisService', () => {
    const sentimentService = SentimentAnalysisService.getInstance();

    it('should analyze comment sentiment', async () => {
      const analysis = await sentimentService.analyzeComment(
        'test-toilet-id',
        'test-user-id',
        'Les toilettes sont très propres et bien entretenues !'
      );

      console.log('Analyse de sentiment:', analysis);
      expect(analysis).toBeDefined();
      expect(analysis.score).toBeGreaterThanOrEqual(-1);
      expect(analysis.score).toBeLessThanOrEqual(1);
      expect(typeof analysis.isToxic).toBe('boolean');
      expect(typeof analysis.isSpam).toBe('boolean');
    });
  });

  // Test du service d'analyse d'image
  describe('ImageAnalysisService', () => {
    const imageService = ImageAnalysisService.getInstance();

    it('should analyze toilet image', async () => {
      const analysis = await imageService.analyzeToiletImage(
        'https://example.com/test-toilet-image.jpg'
      );

      console.log('Analyse d\'image:', analysis);
      expect(analysis).toBeDefined();
      expect(analysis.cleanliness).toBeGreaterThanOrEqual(0);
      expect(analysis.cleanliness).toBeLessThanOrEqual(1);
      expect(typeof analysis.hasPaper).toBe('boolean');
      expect(typeof analysis.hasSoap).toBe('boolean');
      expect(typeof analysis.hasHandDryer).toBe('boolean');
      expect(typeof analysis.isAccessible).toBe('boolean');
    });

    it('should detect equipment in image', async () => {
      const equipment = await imageService.detectEquipment(
        'https://example.com/test-toilet-image.jpg'
      );

      console.log('Équipements détectés:', equipment);
      expect(equipment).toBeDefined();
      expect(Array.isArray(equipment.equipment)).toBe(true);
      expect(equipment.confidence).toBeGreaterThanOrEqual(0);
      expect(equipment.confidence).toBeLessThanOrEqual(1);
    });
  });

  // Test du service de prédiction
  describe('PredictionService', () => {
    const predictionService = PredictionService.getInstance();

    it('should predict toilet status', async () => {
      const prediction = await predictionService.predictToiletStatus('test-toilet-id');

      console.log('Prédiction de statut:', prediction);
      expect(prediction).toBeDefined();
      expect(['available', 'busy', 'maintenance']).toContain(prediction.predictedStatus);
      expect(prediction.busyness).toBeGreaterThanOrEqual(0);
      expect(prediction.busyness).toBeLessThanOrEqual(1);
      expect(Array.isArray(prediction.maintenanceNeeds)).toBe(true);
    });

    it('should analyze maintenance needs', async () => {
      const maintenanceAlerts = await predictionService.analyzeMaintenanceNeeds('test-toilet-id');

      console.log('Alertes de maintenance:', maintenanceAlerts);
      expect(maintenanceAlerts).toBeDefined();
      expect(Array.isArray(maintenanceAlerts)).toBe(true);
      maintenanceAlerts.forEach(alert => {
        expect(['cleanliness', 'maintenance']).toContain(alert.type);
        expect(['low', 'medium', 'high']).toContain(alert.severity);
        expect(typeof alert.message).toBe('string');
      });
    });
  });
}); 