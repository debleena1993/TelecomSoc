import { 
  users, threats, actions, fraudCases, complianceReports, systemConfig,
  type User, type InsertUser, type Threat, type InsertThreat,
  type Action, type InsertAction, type FraudCase, type InsertFraudCase,
  type ComplianceReport, type InsertComplianceReport,
  type SystemConfig, type InsertSystemConfig
} from "@shared/schema";

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

export const storage = new MemStorage();
