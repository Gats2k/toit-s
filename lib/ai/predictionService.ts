import { ToiletPrediction, MaintenanceAlert, HistoricalData, MaintenanceReport } from './types';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/firebase/client';

export class PredictionService {
  private static instance: PredictionService;

  private constructor() {}

  public static getInstance(): PredictionService {
    if (!PredictionService.instance) {
      PredictionService.instance = new PredictionService();
    }
    return PredictionService.instance;
  }

  async predictToiletStatus(toiletId: string): Promise<ToiletPrediction> {
    try {
      const historicalData = await this.getHistoricalData(toiletId);
      const busyness = this.predictBusyness(historicalData);
      const maintenanceNeeds = await this.analyzeMaintenanceNeeds(toiletId);

      return {
        toiletId,
        predictedStatus: this.determineStatus(busyness, maintenanceNeeds),
        busyness,
        maintenanceNeeds,
        confidence: this.calculateConfidence(historicalData),
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Erreur lors de la prédiction du statut:', error);
      throw error;
    }
  }

  async analyzeMaintenanceNeeds(toiletId: string): Promise<MaintenanceAlert[]> {
    try {
      const historicalData = await this.getHistoricalData(toiletId);
      const maintenanceReports = await this.getMaintenanceReports(toiletId);
      
      return this.generateMaintenanceAlerts(historicalData, maintenanceReports);
    } catch (error) {
      console.error('Erreur lors de l\'analyse des besoins de maintenance:', error);
      throw error;
    }
  }

  private async getHistoricalData(toiletId: string): Promise<HistoricalData[]> {
    const dataRef = collection(db, 'toiletStatus');
    const q = query(
      dataRef,
      where('toiletId', '==', toiletId),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        toiletId: data.toiletId,
        status: data.status,
        busyness: data.busyness,
        cleanliness: data.cleanliness,
        timestamp: data.timestamp.toDate()
      };
    });
  }

  private async getMaintenanceReports(toiletId: string): Promise<MaintenanceReport[]> {
    const reportsRef = collection(db, 'maintenanceReports');
    const q = query(
      reportsRef,
      where('toiletId', '==', toiletId),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        toiletId: data.toiletId,
        issue: data.issue,
        severity: data.severity,
        status: data.status,
        timestamp: data.timestamp.toDate()
      };
    });
  }

  private predictBusyness(historicalData: HistoricalData[]): number {
    if (historicalData.length === 0) return 0.5;

    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    // Filtrer les données pour le même jour de la semaine et la même heure
    const relevantData = historicalData.filter(data => {
      const dataDate = new Date(data.timestamp);
      return dataDate.getHours() === hour && dataDate.getDay() === dayOfWeek;
    });

    if (relevantData.length === 0) return 0.5;

    // Calculer la moyenne pondérée
    const totalWeight = relevantData.reduce((sum, data) => {
      const timeDiff = Math.abs(now.getTime() - data.timestamp.getTime());
      return sum + 1 / (timeDiff + 1);
    }, 0);

    const weightedSum = relevantData.reduce((sum, data) => {
      const timeDiff = Math.abs(now.getTime() - data.timestamp.getTime());
      const weight = 1 / (timeDiff + 1);
      return sum + (data.busyness * weight);
    }, 0);

    return weightedSum / totalWeight;
  }

  private determineStatus(busyness: number, maintenanceNeeds: MaintenanceAlert[]): 'available' | 'busy' | 'maintenance' {
    if (maintenanceNeeds.some(alert => alert.severity === 'high')) {
      return 'maintenance';
    }
    return busyness > 0.7 ? 'busy' : 'available';
  }

  private calculateConfidence(historicalData: HistoricalData[]): number {
    if (historicalData.length === 0) return 0.5;

    const recentData = historicalData.filter(data => {
      const timeDiff = Date.now() - data.timestamp.getTime();
      return timeDiff < 7 * 24 * 60 * 60 * 1000; // 7 jours
    });

    if (recentData.length === 0) return 0.5;

    // Plus il y a de données récentes, plus la confiance est élevée
    const dataConfidence = Math.min(recentData.length / 100, 1);

    // La confiance diminue avec le temps
    const timeConfidence = 1 - (Date.now() - recentData[0].timestamp.getTime()) / (7 * 24 * 60 * 60 * 1000);

    return (dataConfidence + timeConfidence) / 2;
  }

  private generateMaintenanceAlerts(
    historicalData: HistoricalData[],
    maintenanceReports: MaintenanceReport[]
  ): MaintenanceAlert[] {
    const alerts: MaintenanceAlert[] = [];

    // Vérifier la propreté
    const recentCleanliness = historicalData
      .filter(data => data.cleanliness !== undefined)
      .slice(0, 10)
      .map(data => data.cleanliness);

    if (recentCleanliness.length > 0) {
      const avgCleanliness = recentCleanliness.reduce((a, b) => a + b, 0) / recentCleanliness.length;
      if (avgCleanliness < 0.3) {
        alerts.push({
          type: 'cleanliness',
          severity: 'high',
          message: 'Nettoyage urgent nécessaire',
          timestamp: new Date()
        });
      } else if (avgCleanliness < 0.6) {
        alerts.push({
          type: 'cleanliness',
          severity: 'medium',
          message: 'Nettoyage recommandé',
          timestamp: new Date()
        });
      }
    }

    // Vérifier les rapports de maintenance récents
    const recentReports = maintenanceReports
      .filter(report => report.status === 'pending')
      .slice(0, 5);

    recentReports.forEach(report => {
      alerts.push({
        type: 'maintenance',
        severity: report.severity,
        message: report.issue,
        timestamp: report.timestamp
      });
    });

    return alerts;
  }
} 