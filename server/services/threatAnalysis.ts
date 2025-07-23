import { analyzeThreatData } from './gemini';
import { storage } from '../storage';
import type { InsertThreat, InsertAction } from '@shared/schema';

export interface CDRRecord {
  callId: string;
  fromNumber: string;
  toNumber: string;
  duration: number;
  timestamp: Date;
  callType: 'voice' | 'sms';
  location?: string;
  imei?: string;
}

export interface SMSRecord {
  messageId: string;
  fromNumber: string;
  toNumber: string;
  message: string;
  timestamp: Date;
  messageType: 'text' | 'binary';
}

export class ThreatAnalysisService {
  async analyzeCDRRecord(cdr: CDRRecord): Promise<void> {
    try {
      const analysis = await analyzeThreatData(JSON.stringify(cdr));
      
      if (analysis.threatScore > 5) {
        const threat: InsertThreat = {
          threatType: analysis.threatType || 'call_fraud',
          source: cdr.fromNumber,
          severity: this.scoresToSeverity(analysis.threatScore),
          aiScore: analysis.threatScore,
          status: 'analyzing',
          description: analysis.description,
          geminiAnalysis: analysis,
          rawData: cdr,
        };

        const createdThreat = await storage.createThreat(threat);
        
        // Auto-response based on configuration and severity
        await this.handleAutoResponse(createdThreat);
      }
    } catch (error) {
      console.error('Error analyzing CDR record:', error);
    }
  }

  async analyzeSMSRecord(sms: SMSRecord): Promise<void> {
    try {
      const analysis = await analyzeThreatData(JSON.stringify(sms));
      
      if (analysis.threatScore > 5) {
        const threat: InsertThreat = {
          threatType: analysis.threatType || 'sms_phishing',
          source: sms.fromNumber,
          severity: this.scoresToSeverity(analysis.threatScore),
          aiScore: analysis.threatScore,
          status: 'analyzing',
          description: analysis.description,
          geminiAnalysis: analysis,
          rawData: sms,
        };

        const createdThreat = await storage.createThreat(threat);
        
        // Auto-response based on configuration and severity
        await this.handleAutoResponse(createdThreat);
      }
    } catch (error) {
      console.error('Error analyzing SMS record:', error);
    }
  }

  async analyzeUserBehavior(userId: string, recentActivity: any[]): Promise<void> {
    try {
      const behaviorData = {
        userId,
        recentActivity,
        timestamp: new Date(),
      };

      const analysis = await analyzeThreatData(JSON.stringify(behaviorData));
      
      if (analysis.threatScore > 6) {
        // Create fraud case
        await storage.createFraudCase({
          userId,
          riskScore: analysis.threatScore,
          indicators: analysis.indicators || [],
          status: 'investigating',
        });

        // Create threat record
        const threat: InsertThreat = {
          threatType: 'sim_swap',
          source: `User: ${userId}`,
          severity: this.scoresToSeverity(analysis.threatScore),
          aiScore: analysis.threatScore,
          status: 'analyzing',
          description: analysis.description,
          geminiAnalysis: analysis,
          rawData: behaviorData,
        };

        const createdThreat = await storage.createThreat(threat);
        await this.handleAutoResponse(createdThreat);
      }
    } catch (error) {
      console.error('Error analyzing user behavior:', error);
    }
  }

  private scoresToSeverity(score: number): string {
    if (score >= 8.5) return 'critical';
    if (score >= 7) return 'high';
    if (score >= 5) return 'medium';
    return 'low';
  }

  private async handleAutoResponse(threat: any): Promise<void> {
    // Get system configuration
    const autoBlockCritical = await storage.getSystemConfig('auto_block_critical');
    const autoBlockFraud = await storage.getSystemConfig('auto_block_fraud');
    const simSwapManual = await storage.getSystemConfig('sim_swap_manual');

    let shouldAutoBlock = false;
    let actionType = '';

    if (threat.severity === 'critical' && autoBlockCritical?.configValue) {
      shouldAutoBlock = true;
      actionType = threat.threatType === 'sms_phishing' ? 'block_phone' : 'block_ip';
    } else if (threat.threatType === 'call_fraud' && autoBlockFraud?.configValue) {
      shouldAutoBlock = true;
      actionType = 'block_phone';
    } else if (threat.threatType === 'sim_swap' && !simSwapManual?.configValue) {
      shouldAutoBlock = true;
      actionType = 'create_case';
    }

    if (shouldAutoBlock) {
      await storage.createAction({
        threatId: threat.id,
        actionType,
        automated: true,
        details: `Auto-blocked ${threat.source} due to ${threat.threatType} with score ${threat.aiScore}`,
      });

      // Update threat status
      await storage.updateThreatStatus(threat.id, 'blocked');
    }
  }

  async generateComplianceReport(startDate: Date, endDate: Date, reportType: string): Promise<string> {
    try {
      const threats = await storage.getThreatsInTimeRange(startDate, endDate);
      const actions = await storage.getRecentActions(1000);
      
      const reportData = {
        startDate,
        endDate,
        threats,
        actions: actions.filter(a => 
          a.timestamp >= startDate && a.timestamp <= endDate
        ),
        threatStats: await storage.getThreatStats(),
      };

      const summary = await generateThreatSummary(JSON.stringify(reportData));
      
      await storage.createComplianceReport({
        reportType,
        startDate,
        endDate,
        summary,
        filePath: `/reports/${reportType}_${Date.now()}.pdf`,
      });

      return summary;
    } catch (error) {
      console.error('Error generating compliance report:', error);
      throw error;
    }
  }
}

export const threatAnalysisService = new ThreatAnalysisService();
