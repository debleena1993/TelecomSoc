import { pgTable, text, serial, integer, boolean, timestamp, json, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const threats = pgTable("threats", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  threatType: text("threat_type").notNull(), // 'sms_phishing', 'call_fraud', 'sim_swap', 'anomalous_traffic'
  source: text("source").notNull(), // IP address, phone number, or user ID
  severity: text("severity").notNull(), // 'critical', 'high', 'medium', 'low'
  aiScore: real("ai_score").notNull(), // 0-10 confidence score from AI
  status: text("status").notNull(), // 'analyzing', 'blocked', 'resolved', 'false_positive'
  description: text("description"),
  geminiAnalysis: json("gemini_analysis"), // Full AI analysis result
  rawData: json("raw_data"), // Original CDR/SMS data
});

export const actions = pgTable("actions", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  threatId: integer("threat_id").references(() => threats.id),
  actionType: text("action_type").notNull(), // 'block_ip', 'block_phone', 'manual_override', 'create_case'
  automated: boolean("automated").notNull().default(false),
  analyst: text("analyst"), // Username of analyst if manual action
  details: text("details"),
});

export const fraudCases = pgTable("fraud_cases", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  riskScore: real("risk_score").notNull(),
  indicators: json("indicators"), // Array of fraud indicators
  status: text("status").notNull(), // 'investigating', 'confirmed', 'false_positive'
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const complianceReports = pgTable("compliance_reports", {
  id: serial("id").primaryKey(),
  reportType: text("report_type").notNull(), // 'incident_summary', 'threat_analysis', 'response_audit'
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  summary: text("summary"),
  filePath: text("file_path"),
});

export const systemConfig = pgTable("system_config", {
  id: serial("id").primaryKey(),
  configKey: text("config_key").notNull().unique(),
  configValue: json("config_value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const telecomUserActivityLog = pgTable("telecom_user_activity_log", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  activityType: text("activity_type").notNull(), // 'call', 'sms'
  direction: text("direction").notNull(), // 'incoming', 'outgoing'
  peerNumber: text("peer_number").notNull(),
  durationSec: integer("duration_sec").notNull().default(0),
  location: text("location").notNull(),
  deviceImei: text("device_imei").notNull(),
  simImsi: text("sim_imsi").notNull(),
  networkType: text("network_type").notNull(), // '4G', '5G', etc.
  dataUsedMb: real("data_used_mb").notNull().default(0.0),
  isRoaming: text("is_roaming").notNull(), // 'yes', 'no'
  isSpamOrFraud: integer("is_spam_or_fraud").notNull().default(0), // 0 or 1
});

// Insert schemas
export const insertThreatSchema = createInsertSchema(threats).omit({
  id: true,
  timestamp: true,
});

export const insertActionSchema = createInsertSchema(actions).omit({
  id: true,
  timestamp: true,
});

export const insertFraudCaseSchema = createInsertSchema(fraudCases).omit({
  id: true,
  timestamp: true,
});

export const insertComplianceReportSchema = createInsertSchema(complianceReports).omit({
  id: true,
  generatedAt: true,
});

export const insertSystemConfigSchema = createInsertSchema(systemConfig).omit({
  id: true,
  updatedAt: true,
});

export const insertTelecomUserActivityLogSchema = createInsertSchema(telecomUserActivityLog).omit({
  id: true,
});

// Types
export type Threat = typeof threats.$inferSelect;
export type InsertThreat = z.infer<typeof insertThreatSchema>;
export type Action = typeof actions.$inferSelect;
export type InsertAction = z.infer<typeof insertActionSchema>;
export type FraudCase = typeof fraudCases.$inferSelect;
export type InsertFraudCase = z.infer<typeof insertFraudCaseSchema>;
export type ComplianceReport = typeof complianceReports.$inferSelect;
export type InsertComplianceReport = z.infer<typeof insertComplianceReportSchema>;
export type SystemConfig = typeof systemConfig.$inferSelect;
export type InsertSystemConfig = z.infer<typeof insertSystemConfigSchema>;
export type TelecomUserActivityLog = typeof telecomUserActivityLog.$inferSelect;
export type InsertTelecomUserActivityLog = z.infer<typeof insertTelecomUserActivityLogSchema>;

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
