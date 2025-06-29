import { SentimentAnalysis, HuggingFaceClassification } from './types';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { HfInference } from '@huggingface/inference';

export class SentimentAnalysisService {
  private static instance: SentimentAnalysisService;
  private hf: HfInference;

  private constructor() {
    this.hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
  }

  public static getInstance(): SentimentAnalysisService {
    if (!SentimentAnalysisService.instance) {
      SentimentAnalysisService.instance = new SentimentAnalysisService();
    }
    return SentimentAnalysisService.instance;
  }

  async analyzeComment(comment: string): Promise<SentimentAnalysis> {
    try {
      // Utiliser le modèle de sentiment de Hugging Face
      const sentiment = await this.hf.textClassification({
        model: 'nlptown/bert-base-multilingual-uncased-sentiment',
        inputs: comment
      }) as HuggingFaceClassification[];

      // Utiliser le modèle de détection de toxicité
      const toxicity = await this.hf.textClassification({
        model: 'facebook/roberta-hate-speech-dynabench-r4-target',
        inputs: comment
      }) as HuggingFaceClassification[];

      // Utiliser le modèle de détection de spam
      const spam = await this.hf.textClassification({
        model: 'microsoft/deberta-v3-base-spam',
        inputs: comment
      }) as HuggingFaceClassification[];

      const result: SentimentAnalysis = {
        score: this.calculateSentimentScore(sentiment),
        isToxic: this.isToxic(toxicity),
        isSpam: this.isSpam(spam),
        confidence: this.calculateConfidence(sentiment, toxicity, spam)
      };

      // Sauvegarder l'analyse
      await this.saveAnalysis(comment, result);

      return result;
    } catch (error) {
      console.error('Erreur lors de l\'analyse de sentiment:', error);
      throw error;
    }
  }

  private calculateSentimentScore(sentiment: HuggingFaceClassification[]): number {
    // Convertir le score de sentiment en une valeur entre -1 et 1
    const score = sentiment[0].score;
    return (score - 0.5) * 2;
  }

  private isToxic(toxicity: HuggingFaceClassification[]): boolean {
    return toxicity[0].label === 'hate' && toxicity[0].score > 0.5;
  }

  private isSpam(spam: HuggingFaceClassification[]): boolean {
    return spam[0].label === 'spam' && spam[0].score > 0.5;
  }

  private calculateConfidence(
    sentiment: HuggingFaceClassification[],
    toxicity: HuggingFaceClassification[],
    spam: HuggingFaceClassification[]
  ): number {
    return (sentiment[0].score + toxicity[0].score + spam[0].score) / 3;
  }

  private async saveAnalysis(comment: string, analysis: SentimentAnalysis) {
    const analysisRef = collection(db, 'sentimentAnalysis');
    await addDoc(analysisRef, {
      comment,
      ...analysis,
      timestamp: new Date()
    });
  }

  async moderateComment(comment: string): Promise<{
    isApproved: boolean;
    reason?: string;
  }> {
    try {
      const analysis = await this.analyzeComment(comment);

      if (analysis.isToxic) {
        return {
          isApproved: false,
          reason: 'Le commentaire contient du contenu toxique'
        };
      }

      if (analysis.isSpam) {
        return {
          isApproved: false,
          reason: 'Le commentaire est considéré comme du spam'
        };
      }

      return { isApproved: true };
    } catch (error) {
      console.error('Erreur lors de la modération du commentaire:', error);
      throw error;
    }
  }

  async getCommentHistory(toiletId: string) {
    const analysisRef = collection(db, 'sentimentAnalysis');
    // TODO: Implémenter la récupération de l'historique
    return [];
  }
} 