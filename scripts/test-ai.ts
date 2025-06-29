import { AIRecommendationService } from '../lib/ai/recommendationService';
import { SentimentAnalysisService } from '../lib/ai/sentimentAnalysisService';
import { ImageAnalysisService } from '../lib/ai/imageAnalysisService';
import { PredictionService } from '../lib/ai/predictionService';

async function testAIServices() {
  console.log('🧪 Démarrage des tests des services AI...\n');

  try {
    // Test des recommandations
    console.log('📊 Test du service de recommandation...');
    const recommendationService = AIRecommendationService.getInstance();
    const recommendations = await recommendationService.getPersonalizedRecommendations(
      'test-user-id',
      {
        accessibility: true,
        cleanliness: 4,
        amenities: ['paper', 'soap'],
        preferredLocations: ['downtown']
      },
      { lat: 48.8566, lng: 2.3522 }
    );
    console.log('✅ Recommandations générées:', recommendations.length);
    console.log('Exemple de recommandation:', recommendations[0], '\n');

    // Test de l'analyse de sentiment
    console.log('😊 Test du service d\'analyse de sentiment...');
    const sentimentService = SentimentAnalysisService.getInstance();
    const sentiment = await sentimentService.analyzeComment(
      'test-toilet-id',
      'test-user-id',
      'Les toilettes sont très propres et bien entretenues !'
    );
    console.log('✅ Analyse de sentiment:', sentiment, '\n');

    // Test de l'analyse d'image
    console.log('🖼️ Test du service d\'analyse d\'image...');
    const imageService = ImageAnalysisService.getInstance();
    const imageAnalysis = await imageService.analyzeToiletImage(
      'https://example.com/test-toilet-image.jpg'
    );
    console.log('✅ Analyse d\'image:', imageAnalysis, '\n');

    // Test des prédictions
    console.log('🔮 Test du service de prédiction...');
    const predictionService = PredictionService.getInstance();
    const prediction = await predictionService.predictToiletStatus('test-toilet-id');
    console.log('✅ Prédiction de statut:', prediction, '\n');

    console.log('✨ Tous les tests sont terminés avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  }
}

// Exécuter les tests
testAIServices(); 