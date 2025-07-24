import { GoogleGenAI } from "@google/genai";
import type { storage } from "../storage.js";

interface AnomalyResult {
  id: string;
  timestamp: Date;
  anomalyType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  description: string;
  affectedMetrics: string[];
  confidence: number;
  source: string;
  details: any;
}

interface AnomalyAnalysisConfig {
  sms_sensitivity: number;
  call_sensitivity: number; 
  fraud_sensitivity: number;
}

export class AnomalyDetectionService {
  private ai: GoogleGenAI;
  private storage: typeof storage;

  constructor(storage: typeof storage) {
    this.storage = storage;
    this.ai = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY || "" 
    });
  }

  async analyzeAnomalies(config?: AnomalyAnalysisConfig): Promise<AnomalyResult[]> {
    try {
      // Check if API key is available
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.trim() === '') {
        console.log("Gemini API key not available, using statistical analysis only");
        return await this.getStatisticalAnomalies();
      }

      // Get recent telecom activity data
      const activities = await this.storage.getTelecomActivities(undefined, 1000);
      const fraudActivities = await this.storage.getTelecomFraudActivities();
      const stats = await this.storage.getTelecomActivityStats();

      if (activities.length === 0) {
        return [];
      }

      // Prepare data for AI analysis
      const analysisData = {
        total_activities: activities.length,
        fraud_activities: fraudActivities.length,
        fraud_rate: fraudActivities.length / activities.length,
        recent_activities: activities.slice(0, 50).map((a: any) => ({
          type: a.activityType,
          duration: a.durationSec,
          location: a.location,
          network: a.networkType,
          is_fraud: a.isSpamOrFraud,
          timestamp: a.timestamp.toISOString()
        })),
        location_stats: stats.topLocations,
        network_stats: stats.networkUsage,
        sensitivity_config: config || {
          sms_sensitivity: 75,
          call_sensitivity: 65,
          fraud_sensitivity: 80
        }
      };

      const prompt = `
You are an expert cybersecurity analyst for telecom networks. Analyze the following telecom data and detect anomalies:

Data: ${JSON.stringify(analysisData, null, 2)}

Based on the sensitivity configuration and data patterns, identify anomalies and respond with a JSON array of anomaly objects. Each anomaly should have:

{
  "id": "unique_identifier",
  "timestamp": "ISO_timestamp", 
  "anomalyType": "type_of_anomaly",
  "severity": "low|medium|high|critical",
  "score": number_0_to_10,
  "description": "detailed_description",
  "affectedMetrics": ["list", "of", "metrics"],
  "confidence": number_0_to_1,
  "source": "data_source_identifier",
  "details": {}
}

Focus on detecting:
1. Unusual call/SMS patterns
2. Location-based anomalies
3. Network usage anomalies 
4. Fraud rate spikes
5. Time-based pattern deviations
6. Statistical outliers

Consider the sensitivity settings when determining severity levels.
`;

      try {
        const response = await this.ai.models.generateContent({
          model: "gemini-2.5-pro",
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  timestamp: { type: "string" },
                  anomalyType: { type: "string" },
                  severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
                  score: { type: "number" },
                  description: { type: "string" },
                  affectedMetrics: { type: "array", items: { type: "string" } },
                  confidence: { type: "number" },
                  source: { type: "string" },
                  details: { type: "object" }
                },
                required: ["id", "timestamp", "anomalyType", "severity", "score", "description", "confidence", "source"]
              }
            }
          },
          contents: prompt
        });

        const rawJson = response.text;
        if (!rawJson) {
          console.error("Empty response from Gemini");
          return await this.getStatisticalAnomalies();
        }

        const anomalies: AnomalyResult[] = JSON.parse(rawJson);
        
        // Validate and process results
        return anomalies.map(anomaly => ({
          ...anomaly,
          timestamp: new Date(anomaly.timestamp),
          affectedMetrics: anomaly.affectedMetrics || [],
          details: anomaly.details || {}
        }));
      } catch (apiError) {
        console.log("Gemini API error, falling back to statistical analysis:", apiError.message);
        return await this.getStatisticalAnomalies();
      }

    } catch (error) {
      console.error("Error in anomaly detection:", error);
      return [];
    }
  }

  async getStatisticalAnomalies(): Promise<AnomalyResult[]> {
    try {
      const activities = await this.storage.getTelecomActivities(undefined, 1000);
      const anomalies: AnomalyResult[] = [];

      if (activities.length < 50) {
        return anomalies; // Need enough data for statistical analysis
      }

      // Analyze call duration patterns
      const callDurations = activities
        .filter((a: any) => a.activityType === 'call' && a.durationSec > 0)
        .map((a: any) => a.durationSec);

      if (callDurations.length > 10) {
        const mean = callDurations.reduce((a: number, b: number) => a + b, 0) / callDurations.length;
        const variance = callDurations.reduce((sum: number, val: number) => sum + Math.pow(val - mean, 2), 0) / callDurations.length;
        const stdDev = Math.sqrt(variance);

        // Find outliers (more than 2 standard deviations from mean)
        const outliers = activities
          .filter((a: any) => 
            a.activityType === 'call' && 
            a.durationSec > 0 &&
            Math.abs(a.durationSec - mean) > 2 * stdDev
          )
          .slice(0, 5); // Limit to prevent too many anomalies

        outliers.forEach((outlier: any, index: number) => {
          const zScore = Math.abs(outlier.durationSec - mean) / stdDev;
          anomalies.push({
            id: `stat_call_${outlier.id}_${index}`,
            timestamp: outlier.timestamp,
            anomalyType: "call_duration_outlier",
            severity: zScore > 3 ? 'critical' : zScore > 2.5 ? 'high' : 'medium',
            score: Math.min(10, zScore),
            description: `Unusual call duration: ${outlier.durationSec}s (expected: ${mean.toFixed(1)}±${stdDev.toFixed(1)}s)`,
            affectedMetrics: ["call_duration"],
            confidence: Math.min(0.95, 0.6 + (zScore - 2) * 0.1),
            source: `user_${outlier.userId}`,
            details: {
              actual_duration: outlier.durationSec,
              expected_mean: mean.toFixed(1),
              standard_deviation: stdDev.toFixed(1),
              z_score: zScore.toFixed(2),
              peer_number: outlier.peerNumber
            }
          });
        });
      }

      // Analyze location frequency patterns
      const locationCounts = activities.reduce((acc: Record<string, number>, activity: any) => {
        acc[activity.location] = (acc[activity.location] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const locationFreqs = Object.values(locationCounts);
      if (locationFreqs.length > 3) {
        const avgFreq = locationFreqs.reduce((a: number, b: number) => a + b, 0) / locationFreqs.length;
        const variance = locationFreqs.reduce((sum: number, val: number) => sum + Math.pow(val - avgFreq, 2), 0) / locationFreqs.length;
        const stdDev = Math.sqrt(variance);
        
        Object.entries(locationCounts).forEach(([location, count]: [string, number]) => {
          const zScore = Math.abs(count - avgFreq) / stdDev;
          if (zScore > 2 && count > avgFreq * 2) { // Significant spike
            anomalies.push({
              id: `stat_location_${location.replace(/\s+/g, '_')}_${Date.now()}`,
              timestamp: new Date(),
              anomalyType: "location_activity_spike",
              severity: zScore > 3 ? 'critical' : count > avgFreq * 4 ? 'high' : 'medium',
              score: Math.min(10, zScore),
              description: `Activity spike in ${location}: ${count} events (${(count/avgFreq).toFixed(1)}x average)`,
              affectedMetrics: ["location_frequency"],
              confidence: Math.min(0.9, 0.5 + zScore * 0.1),
              source: location,
              details: {
                activity_count: count,
                average_count: avgFreq.toFixed(1),
                spike_ratio: (count / avgFreq).toFixed(2),
                z_score: zScore.toFixed(2)
              }
            });
          }
        });
      }

      // Analyze fraud patterns
      const fraudCount = activities.filter((a: any) => a.isSpamOrFraud).length;
      const fraudRate = fraudCount / activities.length;
      
      if (fraudRate > 0.1) { // More than 10% fraud rate
        anomalies.push({
          id: `fraud_rate_spike_${Date.now()}`,
          timestamp: new Date(),
          anomalyType: "fraud_rate_spike",
          severity: fraudRate > 0.2 ? 'critical' : fraudRate > 0.15 ? 'high' : 'medium',
          score: Math.min(10, fraudRate * 50),
          description: `High fraud detection rate: ${(fraudRate * 100).toFixed(1)}% of activities flagged`,
          affectedMetrics: ["fraud_rate", "security_score"],
          confidence: 0.9,
          source: "fraud_detection_system",
          details: {
            fraud_count: fraudCount,
            total_activities: activities.length,
            fraud_percentage: (fraudRate * 100).toFixed(2)
          }
        });
      }

      return anomalies;

    } catch (error) {
      console.error("Error in statistical anomaly detection:", error);
      return [];
    }
  }
}