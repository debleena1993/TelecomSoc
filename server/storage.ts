import { 
  users, threats, actions, fraudCases, complianceReports, systemConfig, telecomUserActivityLog,
  type User, type InsertUser, type Threat, type InsertThreat,
  type Action, type InsertAction, type FraudCase, type InsertFraudCase,
  type ComplianceReport, type InsertComplianceReport,
  type SystemConfig, type InsertSystemConfig, type TelecomUserActivityLog, type InsertTelecomUserActivityLog
} from "@shared/schema";
import { db, dbConnection } from "./config/database";
import { desc, eq, gte, lte, and, count, avg, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Threat methods
  createThreat(threat: InsertThreat): Promise<Threat>;
  getThreats(limit?: number, offset?: number): Promise<Threat[]>;
  getThreatById(id: number): Promise<Threat | undefined>;
  updateThreatStatus(id: number, status: string): Promise<Threat | undefined>;
  getThreatsInTimeRange(startTime: Date, endTime: Date): Promise<Threat[]>;
  getThreatsByType(threatType: string): Promise<Threat[]>;
  getThreatsBySeverity(severity: string): Promise<Threat[]>;

  // Action methods
  createAction(action: InsertAction): Promise<Action>;
  getActionsByThreatId(threatId: number): Promise<Action[]>;
  getRecentActions(limit?: number): Promise<Action[]>;

  // Fraud case methods
  createFraudCase(fraudCase: InsertFraudCase): Promise<FraudCase>;
  getFraudCases(): Promise<FraudCase[]>;
  getFraudCasesByUserId(userId: string): Promise<FraudCase[]>;

  // Compliance report methods
  createComplianceReport(report: InsertComplianceReport): Promise<ComplianceReport>;
  getComplianceReports(): Promise<ComplianceReport[]>;

  // System config methods
  getSystemConfig(key: string): Promise<SystemConfig | undefined>;
  updateSystemConfig(key: string, value: any): Promise<SystemConfig>;

  // Telecom user activity methods
  getTelecomActivities(userId?: string, limit?: number, offset?: number): Promise<TelecomUserActivityLog[]>;
  getTelecomFraudActivities(userId?: string): Promise<TelecomUserActivityLog[]>;
  getTelecomActivityStats(userId?: string, timeRange?: string): Promise<{
    totalActivities: number;
    callCount: number;
    smsCount: number;
    fraudCount: number;
    fraudRate: number;
    topLocations: Array<{ location: string; count: number; fraudCount: number }>;
    networkUsage: Array<{ networkType: string; count: number }>;
  }>;
  getTelecomUserRiskScore(userId: string): Promise<number>;
  getTelecomOverallRiskScore(): Promise<number>;

  // Analytics methods
  getThreatStats(): Promise<{
    activeThreats: number;
    riskScore: number;
    blockedIPs: number;
    detectionRate: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private threats: Map<number, Threat>;
  private actions: Map<number, Action>;
  private fraudCases: Map<number, FraudCase>;
  private complianceReports: Map<number, ComplianceReport>;
  private systemConfig: Map<string, SystemConfig>;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.threats = new Map();
    this.actions = new Map();
    this.fraudCases = new Map();
    this.complianceReports = new Map();
    this.systemConfig = new Map();
    this.currentId = 1;

    // Initialize default system config
    this.initializeSystemConfig();
  }

  private initializeSystemConfig() {
    const defaultConfigs = [
      { configKey: 'sms_sensitivity', configValue: 80 },
      { configKey: 'call_sensitivity', configValue: 60 },
      { configKey: 'fraud_sensitivity', configValue: 85 },
      { configKey: 'auto_block_critical', configValue: true },
      { configKey: 'auto_block_fraud', configValue: true },
      { configKey: 'sim_swap_manual', configValue: false },
    ];

    defaultConfigs.forEach((config, index) => {
      const systemConfig: SystemConfig = {
        id: index + 1,
        configKey: config.configKey,
        configValue: config.configValue,
        updatedAt: new Date(),
      };
      this.systemConfig.set(config.configKey, systemConfig);
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createThreat(insertThreat: InsertThreat): Promise<Threat> {
    const id = this.currentId++;
    const threat: Threat = { 
      ...insertThreat, 
      id, 
      timestamp: new Date(),
      description: insertThreat.description || null,
      geminiAnalysis: insertThreat.geminiAnalysis || null,
      rawData: insertThreat.rawData || null
    };
    this.threats.set(id, threat);
    return threat;
  }

  async getThreats(limit = 100, offset = 0): Promise<Threat[]> {
    const allThreats = Array.from(this.threats.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return allThreats.slice(offset, offset + limit);
  }

  async getThreatById(id: number): Promise<Threat | undefined> {
    return this.threats.get(id);
  }

  async updateThreatStatus(id: number, status: string): Promise<Threat | undefined> {
    const threat = this.threats.get(id);
    if (threat) {
      threat.status = status;
      this.threats.set(id, threat);
      return threat;
    }
    return undefined;
  }

  async getThreatsInTimeRange(startTime: Date, endTime: Date): Promise<Threat[]> {
    return Array.from(this.threats.values())
      .filter(threat => threat.timestamp >= startTime && threat.timestamp <= endTime)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getThreatsByType(threatType: string): Promise<Threat[]> {
    return Array.from(this.threats.values())
      .filter(threat => threat.threatType === threatType)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getThreatsBySeverity(severity: string): Promise<Threat[]> {
    return Array.from(this.threats.values())
      .filter(threat => threat.severity === severity)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async createAction(insertAction: InsertAction): Promise<Action> {
    const id = this.currentId++;
    const action: Action = { 
      ...insertAction, 
      id, 
      timestamp: new Date(),
      details: insertAction.details || null,
      threatId: insertAction.threatId || null,
      automated: insertAction.automated || false,
      analyst: insertAction.analyst || null
    };
    this.actions.set(id, action);
    return action;
  }

  async getActionsByThreatId(threatId: number): Promise<Action[]> {
    return Array.from(this.actions.values())
      .filter(action => action.threatId === threatId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getRecentActions(limit = 50): Promise<Action[]> {
    return Array.from(this.actions.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async createFraudCase(insertFraudCase: InsertFraudCase): Promise<FraudCase> {
    const id = this.currentId++;
    const fraudCase: FraudCase = { 
      ...insertFraudCase, 
      id, 
      timestamp: new Date(),
      indicators: insertFraudCase.indicators || []
    };
    this.fraudCases.set(id, fraudCase);
    return fraudCase;
  }

  async getFraudCases(): Promise<FraudCase[]> {
    return Array.from(this.fraudCases.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getFraudCasesByUserId(userId: string): Promise<FraudCase[]> {
    return Array.from(this.fraudCases.values())
      .filter(fraudCase => fraudCase.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async createComplianceReport(insertReport: InsertComplianceReport): Promise<ComplianceReport> {
    const id = this.currentId++;
    const report: ComplianceReport = { 
      ...insertReport, 
      id, 
      generatedAt: new Date(),
      summary: insertReport.summary || null,
      filePath: insertReport.filePath || null
    };
    this.complianceReports.set(id, report);
    return report;
  }

  async getComplianceReports(): Promise<ComplianceReport[]> {
    return Array.from(this.complianceReports.values())
      .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());
  }

  async getSystemConfig(key: string): Promise<SystemConfig | undefined> {
    return this.systemConfig.get(key);
  }

  async updateSystemConfig(key: string, value: any): Promise<SystemConfig> {
    const existing = this.systemConfig.get(key);
    const config: SystemConfig = {
      id: existing?.id || this.currentId++,
      configKey: key,
      configValue: value,
      updatedAt: new Date(),
    };
    this.systemConfig.set(key, config);
    return config;
  }

  // Telecom user activity methods - use database for real data
  async getTelecomActivities(userId?: string, limit?: number, offset?: number): Promise<TelecomUserActivityLog[]> {
    // Return empty array for MemStorage, will be overridden by database implementation
    return [];
  }

  async getTelecomFraudActivities(userId?: string): Promise<TelecomUserActivityLog[]> {
    // Return empty array for MemStorage, will be overridden by database implementation
    return [];
  }

  async getTelecomActivityStats(userId?: string, timeRange?: string): Promise<{
    totalActivities: number;
    callCount: number;
    smsCount: number;
    fraudCount: number;
    fraudRate: number;
    topLocations: Array<{ location: string; count: number; fraudCount: number }>;
    networkUsage: Array<{ networkType: string; count: number }>;
  }> {
    // Return default stats for MemStorage, will be overridden by database implementation
    return {
      totalActivities: 0,
      callCount: 0,
      smsCount: 0,
      fraudCount: 0,
      fraudRate: 0,
      topLocations: [],
      networkUsage: []
    };
  }

  async getTelecomUserRiskScore(userId: string): Promise<number> {
    // Return default risk score for MemStorage, will be overridden by database implementation
    return 0;
  }

  async getTelecomOverallRiskScore(): Promise<number> {
    // Return default overall risk score for MemStorage, will be overridden by database implementation
    return 3;
  }

  async getThreatStats(): Promise<{
    activeThreats: number;
    riskScore: number;
    blockedIPs: number;
    detectionRate: number;
  }> {
    const allThreats = Array.from(this.threats.values());
    const activeThreats = allThreats.filter(t => t.status === 'analyzing' || t.status === 'blocked').length;
    
    // Calculate average risk score from recent threats
    const recentThreats = allThreats
      .filter(t => new Date().getTime() - t.timestamp.getTime() < 24 * 60 * 60 * 1000) // Last 24 hours
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 100);
    
    const avgRiskScore = recentThreats.length > 0 
      ? recentThreats.reduce((sum, t) => sum + t.aiScore, 0) / recentThreats.length 
      : 0;

    // Count blocked IPs from actions
    const blockActions = Array.from(this.actions.values())
      .filter(a => a.actionType === 'block_ip');
    
    const blockedIPs = new Set(blockActions.map(a => a.details)).size;

    // Detection rate calculation (threats detected vs total traffic)
    const detectionRate = 99.7; // Mock value, would be calculated from actual traffic data

    return {
      activeThreats,
      riskScore: Number(avgRiskScore.toFixed(1)),
      blockedIPs,
      detectionRate,
    };
  }
}

// Database-backed storage implementation
class DatabaseStorage implements IStorage {
  private db: any;
  private memStorage: MemStorage;

  constructor() {
    // Use the configured database connection
    this.db = db;
    this.memStorage = new MemStorage();
    
    // Test database connection on initialization
    this.testDatabaseConnection();
  }

  private async testDatabaseConnection(): Promise<void> {
    try {
      const isConnected = await dbConnection.testConnection();
      if (isConnected) {
        const config = dbConnection.getConfig();
        console.log(`✅ Database connection verified: ${config.host}:${config.port}/${config.database}`);
      } else {
        console.log('❌ Database connection test failed, falling back to memory storage');
      }
    } catch (error) {
      console.error('Database connection error:', error);
      console.log('Falling back to memory storage for data operations');
    }
  }

  // Delegate most methods to MemStorage for now
  async getUser(id: number) { return this.memStorage.getUser(id); }
  async getUserByUsername(username: string) { return this.memStorage.getUserByUsername(username); }
  async createUser(user: InsertUser) { return this.memStorage.createUser(user); }
  async createThreat(threat: InsertThreat) { return this.memStorage.createThreat(threat); }
  async getThreats(limit?: number, offset?: number) { return this.memStorage.getThreats(limit, offset); }
  async getThreatById(id: number) { return this.memStorage.getThreatById(id); }
  async updateThreatStatus(id: number, status: string) { return this.memStorage.updateThreatStatus(id, status); }
  async getThreatsInTimeRange(startTime: Date, endTime: Date) { return this.memStorage.getThreatsInTimeRange(startTime, endTime); }
  async getThreatsByType(threatType: string) { return this.memStorage.getThreatsByType(threatType); }
  async getThreatsBySeverity(severity: string) { return this.memStorage.getThreatsBySeverity(severity); }
  async createAction(action: InsertAction) { return this.memStorage.createAction(action); }
  async getActionsByThreatId(threatId: number) { return this.memStorage.getActionsByThreatId(threatId); }
  async getRecentActions(limit?: number) { return this.memStorage.getRecentActions(limit); }
  async createFraudCase(fraudCase: InsertFraudCase) { return this.memStorage.createFraudCase(fraudCase); }
  async getFraudCases() { return this.memStorage.getFraudCases(); }
  async getFraudCasesByUserId(userId: string) { return this.memStorage.getFraudCasesByUserId(userId); }
  async createComplianceReport(report: InsertComplianceReport) { return this.memStorage.createComplianceReport(report); }
  async getComplianceReports() { return this.memStorage.getComplianceReports(); }
  async getSystemConfig(key: string) { return this.memStorage.getSystemConfig(key); }
  async updateSystemConfig(key: string, value: any) { return this.memStorage.updateSystemConfig(key, value); }
  async getThreatStats() { return this.memStorage.getThreatStats(); }

  // Implement telecom methods with real database queries
  async getTelecomActivities(userId?: string, limit = 100, offset = 0): Promise<TelecomUserActivityLog[]> {
    if (!this.db) return [];
    
    let query = this.db.select().from(telecomUserActivityLog);
    
    if (userId) {
      query = query.where(eq(telecomUserActivityLog.userId, userId));
    }
    try {
      const results = await query
        .orderBy(desc(telecomUserActivityLog.timestamp))
        .limit(limit)
        .offset(offset);
      
      return results;
    } catch (error) {
      console.error('Error fetching telecom activities:', error);
      return [];
    }
  }

  async getTelecomFraudActivities(userId?: string): Promise<TelecomUserActivityLog[]> {
    if (!this.db) return [];
    
    let query = this.db.select().from(telecomUserActivityLog)
      .where(eq(telecomUserActivityLog.isSpamOrFraud, 1));
    
    if (userId) {
      query = query.where(and(
        eq(telecomUserActivityLog.isSpamOrFraud, 1),
        eq(telecomUserActivityLog.userId, userId)
      ));
    }
    
    return await query.orderBy(desc(telecomUserActivityLog.timestamp));
  }

  async getTelecomActivityStats(userId?: string, timeRange?: string): Promise<{
    totalActivities: number;
    callCount: number;
    smsCount: number;
    fraudCount: number;
    fraudRate: number;
    topLocations: Array<{ location: string; count: number; fraudCount: number }>;
    networkUsage: Array<{ networkType: string; count: number }>;
  }> {
    if (!this.db) {
      return {
        totalActivities: 0,
        callCount: 0,
        smsCount: 0,
        fraudCount: 0,
        fraudRate: 0,
        topLocations: [],
        networkUsage: []
      };
    }

    // Build time filter if provided
    let timeFilter;
    if (timeRange) {
      const now = new Date();
      let startTime = new Date();
      
      switch (timeRange) {
        case 'hour':
          startTime = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '24hours':
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }
      timeFilter = gte(telecomUserActivityLog.timestamp, startTime);
    }

    // Build user filter
    let userFilter;
    if (userId) {
      userFilter = eq(telecomUserActivityLog.userId, userId);
    }

    // Combine filters
    let whereCondition;
    if (timeFilter && userFilter) {
      whereCondition = and(timeFilter, userFilter);
    } else if (timeFilter) {
      whereCondition = timeFilter;
    } else if (userFilter) {
      whereCondition = userFilter;
    }

    // Get basic stats
    const basicStatsQuery = this.db
      .select({
        totalActivities: count(),
        fraudCount: sql<number>`SUM(CASE WHEN ${telecomUserActivityLog.isSpamOrFraud} = 1 THEN 1 ELSE 0 END)`,
        callCount: sql<number>`SUM(CASE WHEN ${telecomUserActivityLog.activityType} = 'call' THEN 1 ELSE 0 END)`,
        smsCount: sql<number>`SUM(CASE WHEN ${telecomUserActivityLog.activityType} = 'sms' THEN 1 ELSE 0 END)`
      })
      .from(telecomUserActivityLog);

    if (whereCondition) {
      basicStatsQuery.where(whereCondition);
    }

    let basicStats;
    try {
      basicStats = await basicStatsQuery;
    } catch (error) {
      console.error('Error fetching basic stats:', error);
      return {
        totalActivities: 0,
        callCount: 0,
        smsCount: 0,
        fraudCount: 0,
        fraudRate: 0,
        topLocations: [],
        networkUsage: []
      };
    }
    const stats = basicStats[0];

    // Get top locations
    const locationsQuery = this.db
      .select({
        location: telecomUserActivityLog.location,
        count: count(),
        fraudCount: sql<number>`SUM(CASE WHEN ${telecomUserActivityLog.isSpamOrFraud} = 1 THEN 1 ELSE 0 END)`
      })
      .from(telecomUserActivityLog)
      .groupBy(telecomUserActivityLog.location)
      .orderBy(desc(count()))
      .limit(10);

    if (whereCondition) {
      locationsQuery.where(whereCondition);
    }

    const topLocations = await locationsQuery;

    // Get network usage
    const networkQuery = this.db
      .select({
        networkType: telecomUserActivityLog.networkType,
        count: count()
      })
      .from(telecomUserActivityLog)
      .groupBy(telecomUserActivityLog.networkType)
      .orderBy(desc(count()));

    if (whereCondition) {
      networkQuery.where(whereCondition);
    }

    const networkUsage = await networkQuery;

    const fraudRate = stats.totalActivities > 0 ? (stats.fraudCount / stats.totalActivities) * 100 : 0;

    return {
      totalActivities: stats.totalActivities,
      callCount: stats.callCount,
      smsCount: stats.smsCount,
      fraudCount: stats.fraudCount,
      fraudRate: Number(fraudRate.toFixed(2)),
      topLocations: topLocations.map((loc: any) => ({
        location: loc.location,
        count: loc.count,
        fraudCount: loc.fraudCount
      })),
      networkUsage: networkUsage.map((net: any) => ({
        networkType: net.networkType,
        count: net.count
      }))
    };
  }

  async getTelecomUserRiskScore(userId: string): Promise<number> {
    if (!this.db) return 0;

    // Calculate risk score based on recent activity patterns
    const recentActivityQuery = this.db
      .select({
        totalActivities: count(),
        fraudCount: sql<number>`SUM(CASE WHEN ${telecomUserActivityLog.isSpamOrFraud} = 1 THEN 1 ELSE 0 END)`,
        roamingCount: sql<number>`SUM(CASE WHEN ${telecomUserActivityLog.isRoaming} = 'yes' THEN 1 ELSE 0 END)`,
        avgCallDuration: avg(telecomUserActivityLog.durationSec)
      })
      .from(telecomUserActivityLog)
      .where(and(
        eq(telecomUserActivityLog.userId, userId),
        gte(telecomUserActivityLog.timestamp, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // Last 7 days
      ));

    const result = await recentActivityQuery;
    const stats = result[0];

    if (!stats || stats.totalActivities === 0) return 0;

    // Risk factors
    const fraudRate = (stats.fraudCount / stats.totalActivities) * 100;
    const roamingRate = (stats.roamingCount / stats.totalActivities) * 100;
    const avgDuration = stats.avgCallDuration || 0;

    // Calculate composite risk score (0-10 scale)
    let riskScore = 0;
    
    // High fraud rate increases risk
    if (fraudRate > 20) riskScore += 4;
    else if (fraudRate > 10) riskScore += 2;
    else if (fraudRate > 5) riskScore += 1;
    
    // High roaming rate increases risk
    if (roamingRate > 50) riskScore += 2;
    else if (roamingRate > 30) riskScore += 1;
    
    // Unusual call patterns
    if (avgDuration > 600) riskScore += 1; // Very long calls
    if (avgDuration < 30) riskScore += 0.5; // Very short calls
    
    // High activity volume
    if (stats.totalActivities > 100) riskScore += 1;

    return Math.min(10, Number(riskScore.toFixed(1)));
  }

  async getTelecomOverallRiskScore(): Promise<number> {
    if (!this.db) return 3;

    // Calculate overall risk score based on all recent activity patterns
    const recentActivityQuery = this.db
      .select({
        totalActivities: count(),
        fraudCount: sql<number>`SUM(CASE WHEN ${telecomUserActivityLog.isSpamOrFraud} = 1 THEN 1 ELSE 0 END)`,
        roamingCount: sql<number>`SUM(CASE WHEN ${telecomUserActivityLog.isRoaming} = 'yes' THEN 1 ELSE 0 END)`,
        avgCallDuration: avg(telecomUserActivityLog.durationSec)
      })
      .from(telecomUserActivityLog)
      .where(
        gte(telecomUserActivityLog.timestamp, new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
      );

    const result = await recentActivityQuery;
    const stats = result[0];

    if (!stats || stats.totalActivities === 0) return 3;

    // Risk factors for overall network
    const fraudRate = (stats.fraudCount / stats.totalActivities) * 100;
    const roamingRate = (stats.roamingCount / stats.totalActivities) * 100;
    const avgDuration = stats.avgCallDuration || 0;

    // Calculate composite risk score (0-10 scale)
    let riskScore = 3; // Base risk level
    
    // High fraud rate increases risk significantly
    if (fraudRate > 15) riskScore += 3;
    else if (fraudRate > 8) riskScore += 2;
    else if (fraudRate > 3) riskScore += 1;
    
    // High roaming activity increases risk
    if (roamingRate > 40) riskScore += 1;
    else if (roamingRate > 20) riskScore += 0.5;
    
    // Unusual network patterns
    if (avgDuration > 500) riskScore += 0.5; // Very long calls
    if (avgDuration < 45) riskScore += 0.5; // Very short calls
    
    // High activity volume indicates potential attack
    if (stats.totalActivities > 500) riskScore += 1;
    else if (stats.totalActivities > 200) riskScore += 0.5;

    return Math.min(10, Number(riskScore.toFixed(1)));
  }
}

export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();
