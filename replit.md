# replit.md

## Overview

This is a full-stack telecom cybersecurity monitoring platform called "TelecomSOC" that provides real-time threat detection and automated response capabilities. The application combines modern web technologies with AI-powered threat analysis to monitor SMS, call, and network traffic patterns for security threats.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and production builds
- **Routing**: Wouter for client-side routing
- **UI Framework**: Shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom PwC-inspired cybersecurity theme
- **State Management**: TanStack Query for server state and real-time data
- **Data Fetching**: Custom query client with automatic retries and real-time updates

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **API Design**: RESTful endpoints with JSON responses
- **Session Management**: PostgreSQL-based sessions with connect-pg-simple

### AI Integration
- **AI Provider**: Google Gemini 2.5 Pro API
- **Purpose**: Threat analysis, pattern detection, and automated response recommendations
- **Features**: JSON-structured responses for threat scoring, classification, and recommendations

## Key Components

### Database Schema
Located in `shared/schema.ts`, defines core entities:
- **users**: Authentication and user management
- **threats**: Core threat detection records with AI analysis
- **actions**: Automated and manual response actions
- **fraudCases**: User-specific fraud investigations
- **complianceReports**: Regulatory reporting and audit trails
- **systemConfig**: Dynamic system configuration

### Real-time Data Services
- **Mock Data Generator**: Simulates realistic telecom data (CDR, SMS, user behavior)
- **Threat Analysis Service**: AI-powered analysis of telecom patterns
- **Auto-response System**: Configurable automated threat mitigation

### Frontend Features
- **Real-time Dashboard**: Live threat monitoring with auto-refresh
- **Anomaly Detection**: Pattern analysis with configurable sensitivity
- **Fraud Detection**: User behavior analysis and risk scoring
- **Auto Response**: Configurable automated actions and manual overrides
- **Compliance Reports**: Regulatory reporting and audit trail generation

## Data Flow

1. **Data Ingestion**: Mock data generators simulate realistic telecom traffic (CDR records, SMS messages, user activities)
2. **AI Analysis**: Gemini API analyzes data patterns and assigns threat scores (0-10 scale)
3. **Threat Classification**: System categorizes threats by type (SMS phishing, call fraud, SIM swap, anomalous traffic) and severity (critical, high, medium, low)
4. **Automated Response**: Configurable rules trigger automatic actions (IP blocking, phone number blocking, case creation)
5. **Real-time Updates**: Frontend receives live updates via polling (5-second intervals for threats, 10-second for stats)
6. **Manual Intervention**: Analysts can override automated decisions and create manual actions
7. **Compliance Tracking**: All actions and decisions are logged for regulatory reporting

## External Dependencies

### Core Dependencies
- **@google/genai**: Gemini AI integration for threat analysis
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **express**: Backend HTTP server
- **connect-pg-simple**: PostgreSQL session storage

### UI Dependencies
- **@radix-ui/***: Comprehensive UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **wouter**: Lightweight React router
- **class-variance-authority**: Component variant management

### Development Dependencies
- **tsx**: TypeScript execution for development
- **vite**: Build tool and development server
- **esbuild**: Production build optimization

## Deployment Strategy

### Development Environment
- **Hot Reload**: Vite dev server with HMR support
- **Database**: Requires DATABASE_URL environment variable
- **AI Integration**: Requires GEMINI_API_KEY environment variable
- **Mock Data**: Automatic generation of realistic telecom data

### Production Build
1. **Frontend**: Vite builds static assets to `dist/public`
2. **Backend**: esbuild bundles server code to `dist/index.js`
3. **Database**: Drizzle migrations in `migrations/` directory
4. **Static Serving**: Express serves built frontend in production

### Configuration Requirements
- **DATABASE_URL**: PostgreSQL connection string (Neon Database recommended)
- **GEMINI_API_KEY**: Google AI API key for threat analysis
- **NODE_ENV**: Environment setting (development/production)

### Key Design Decisions

1. **Real-time Architecture**: Chose polling over WebSockets for simplicity and reliability in cloud environments
2. **AI Integration**: Gemini API provides structured JSON responses for consistent threat analysis
3. **Database Choice**: PostgreSQL with Drizzle ORM for type safety and complex queries
4. **Component Architecture**: Shadcn/ui for consistent, accessible UI components
5. **Mock Data Strategy**: Realistic simulation allows development and testing without real telecom infrastructure
6. **Monolithic Structure**: Single repository with shared types for rapid development and deployment

The system is designed for scalability, with clear separation between data ingestion, AI analysis, and user interface layers. The real-time capabilities and automated response features make it suitable for production cybersecurity monitoring environments.