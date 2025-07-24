import dotenv from 'dotenv';
dotenv.config();

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  max?: number;
  idle_timeout?: number;
  connect_timeout?: number;
}

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private client: any;
  private db: any;
  private config: DatabaseConfig;

  private constructor() {
    this.config = this.getDatabaseConfig();
    this.initializeConnection();
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  private getDatabaseConfig(): DatabaseConfig {
    // Try to get individual connection parameters first
    const host = process.env.PGHOST;
    const port = process.env.PGPORT;
    const database = process.env.PGDATABASE;
    const username = process.env.PGUSER;
    const password = process.env.PGPASSWORD;

    if (host && port && database && username && password) {
      return {
        host,
        port: parseInt(port, 10),
        database,
        username,
        password,
        ssl: process.env.NODE_ENV === 'production' || process.env.DATABASE_URL?.includes('sslmode=require'),
        max: 20,
        idle_timeout: 30,
        connect_timeout: 30,
      };
    }

    // Fallback to DATABASE_URL if individual params not available
    if (process.env.DATABASE_URL) {
      const url = new URL(process.env.DATABASE_URL);
      return {
        host: url.hostname,
        port: parseInt(url.port, 10) || 5432,
        database: url.pathname.slice(1), // Remove leading slash
        username: url.username,
        password: url.password,
        ssl: process.env.NODE_ENV === 'production' || process.env.DATABASE_URL?.includes('sslmode=require'),
        max: 20,
        idle_timeout: 30,
        connect_timeout: 30,
      };
    }

    throw new Error('Database configuration not found. Please set PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD or DATABASE_URL environment variables.');
  }

  private initializeConnection(): void {
    try {
      // Create connection using DATABASE_URL directly if available (preferred for Replit)
      if (process.env.DATABASE_URL) {
        // Use DATABASE_URL with proper SSL configuration
        this.client = postgres(process.env.DATABASE_URL, { 
          ssl: process.env.DATABASE_URL.includes('sslmode=require') ? 'require' : false,
          max: 20,
          idle_timeout: 30,
          connect_timeout: 30,
        });
      } else if (this.config.host) {
        // Fallback to individual parameters
        this.client = postgres({
          host: this.config.host,
          port: this.config.port,
          database: this.config.database,
          username: this.config.username,
          password: this.config.password,
          ssl: this.config.ssl ? 'require' : false,
          max: this.config.max,
          idle_timeout: this.config.idle_timeout,
          connect_timeout: this.config.connect_timeout,
        });
      } else {
        throw new Error('No database connection configuration available');
      }

      this.db = drizzle(this.client);
      console.log(`Database connected successfully to ${this.config.host}:${this.config.port}/${this.config.database}`);
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  }

  public getDatabase() {
    return this.db;
  }

  public getClient() {
    return this.client;
  }

  public getConfig(): DatabaseConfig {
    return { ...this.config };
  }

  public async testConnection(): Promise<boolean> {
    try {
      if (this.client) {
        await this.client`SELECT 1 as test`;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  public async close(): Promise<void> {
    if (this.client) {
      await this.client.end();
    }
  }
}

// Export a singleton instance
export const dbConnection = DatabaseConnection.getInstance();
export const db = dbConnection.getDatabase();