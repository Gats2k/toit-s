import { ImageAnalysis, HuggingFaceClassification, HuggingFaceDetection } from './types';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { HfInference } from '@huggingface/inference';

export class ImageAnalysisService {
  private static instance: ImageAnalysisService;
  private hf: HfInference;

  private constructor() {
    this.hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
  }

  public static getInstance(): ImageAnalysisService {
    if (!ImageAnalysisService.instance) {
      ImageAnalysisService.instance = new ImageAnalysisService();
    }
    return ImageAnalysisService.instance;
  }

  async analyzeToiletImage(imageUrl: string): Promise<ImageAnalysis> {
    try {
      // Utiliser le modèle de classification d'images de Hugging Face
      const imageClassification = await this.hf.imageClassification({
        model: 'microsoft/resnet-50',
        data: await this.fetchImageAsBlob(imageUrl)
      }) as HuggingFaceClassification[];

      // Utiliser le modèle de détection d'objets
      const objectDetection = await this.hf.objectDetection({
        model: 'facebook/detr-resnet-50',
        data: await this.fetchImageAsBlob(imageUrl)
      }) as HuggingFaceDetection[];

      // Analyser les résultats
      const cleanliness = this.calculateCleanlinessScore(imageClassification);
      const equipment = this.identifyEquipment(objectDetection);
      const isAccessible = this.checkAccessibility(objectDetection);

      const result: ImageAnalysis = {
        cleanliness,
        hasPaper: equipment.includes('paper'),
        hasSoap: equipment.includes('soap'),
        hasHandDryer: equipment.includes('hand_dryer'),
        isAccessible,
        confidence: this.calculateConfidence(imageClassification, objectDetection)
      };

      // Sauvegarder l'analyse
      await this.saveAnalysis(imageUrl, result);

      return result;
    } catch (error) {
      console.error('Erreur lors de l\'analyse d\'image:', error);
      throw error;
    }
  }

  private async fetchImageAsBlob(imageUrl: string): Promise<Blob> {
    const response = await fetch(imageUrl);
    return await response.blob();
  }

  private calculateCleanlinessScore(classification: HuggingFaceClassification[]): number {
    // Analyser les scores de classification pour déterminer la propreté
    const cleanlinessLabels = ['clean', 'dirty', 'messy', 'spotless'];
    const cleanlinessScore = classification
      .filter(c => cleanlinessLabels.includes(c.label))
      .reduce((sum, c) => sum + c.score, 0);

    return Math.max(0, Math.min(1, cleanlinessScore));
  }

  private identifyEquipment(detection: HuggingFaceDetection[]): string[] {
    const equipment = new Set<string>();
    
    detection.forEach(item => {
      const label = item.label.toLowerCase();
      if (label.includes('paper')) equipment.add('paper');
      if (label.includes('soap')) equipment.add('soap');
      if (label.includes('dryer')) equipment.add('hand_dryer');
    });

    return Array.from(equipment);
  }

  private checkAccessibility(detection: HuggingFaceDetection[]): boolean {
    // Vérifier la présence d'équipements d'accessibilité
    const accessibilityFeatures = ['wheelchair', 'ramp', 'handrail'];
    return detection.some(item => 
      accessibilityFeatures.some(feature => 
        item.label.toLowerCase().includes(feature)
      )
    );
  }

  private calculateConfidence(
    classification: HuggingFaceClassification[],
    detection: HuggingFaceDetection[]
  ): number {
    // Calculer un score de confiance global
    const classificationConfidence = classification.reduce(
      (sum, c) => sum + c.score, 
      0
    ) / classification.length;

    const detectionConfidence = detection.reduce(
      (sum, d) => sum + d.score, 
      0
    ) / detection.length;

    return (classificationConfidence + detectionConfidence) / 2;
  }

  private async saveAnalysis(imageUrl: string, analysis: ImageAnalysis) {
    const analysisRef = collection(db, 'imageAnalysis');
    await addDoc(analysisRef, {
      imageUrl,
      ...analysis,
      timestamp: new Date()
    });
  }

  async getToiletImageHistory(toiletId: string) {
    const analysisRef = collection(db, 'imageAnalysis');
    // TODO: Implémenter la récupération de l'historique
    return [];
  }

  async detectEquipment(imageUrl: string): Promise<{
    equipment: string[];
    confidence: number;
  }> {
    try {
      const detection = await this.hf.objectDetection({
        model: 'facebook/detr-resnet-50',
        data: await this.fetchImageAsBlob(imageUrl)
      }) as HuggingFaceDetection[];

      const equipment = this.identifyEquipment(detection);
      const confidence = this.calculateConfidence([], detection);

      return {
        equipment,
        confidence
      };
    } catch (error) {
      console.error('Erreur lors de la détection d\'équipements:', error);
      throw error;
    }
  }

  async assessCleanliness(imageUrl: string): Promise<{
    score: number;
    issues: string[];
    confidence: number;
  }> {
    try {
      const classification = await this.hf.imageClassification({
        model: 'microsoft/resnet-50',
        data: await this.fetchImageAsBlob(imageUrl)
      }) as HuggingFaceClassification[];

      const score = this.calculateCleanlinessScore(classification);
      const issues = this.identifyCleanlinessIssues(classification);
      const confidence = this.calculateConfidence(classification, []);

      return {
        score,
        issues,
        confidence
      };
    } catch (error) {
      console.error('Erreur lors de l\'évaluation de la propreté:', error);
      throw error;
    }
  }

  private identifyCleanlinessIssues(classification: HuggingFaceClassification[]): string[] {
    const issues: string[] = [];
    const dirtyLabels = ['dirty', 'messy', 'stained', 'broken'];

    classification.forEach(c => {
      if (dirtyLabels.includes(c.label) && c.score > 0.5) {
        issues.push(c.label);
      }
    });

    return issues;
  }
} 