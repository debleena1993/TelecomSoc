# Local Database Connection Guide

## Option 1: Update Environment Variable
Replace the DATABASE_URL in your environment with your local PostgreSQL connection string:

```bash
DATABASE_URL="postgresql://username:password@localhost:5432/your_database_name"
```

## Option 2: Direct Database Migration

### Step 1: Export Current Schema
Run this command to generate the database schema:
```bash
npm run db:push
```

### Step 2: Create Tables in Your Local Database
Execute these SQL commands in your local PostgreSQL:

```sql
-- Create telecom_user_activity_log table
CREATE TABLE telecom_user_activity_log (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    activity_type VARCHAR(20) NOT NULL,
    direction VARCHAR(10) NOT NULL,
    peer_number VARCHAR(20) NOT NULL,
    duration_sec INTEGER,
    location VARCHAR(100) NOT NULL,
    network_type VARCHAR(20) NOT NULL,
    is_roaming VARCHAR(10) NOT NULL,
    is_spam_or_fraud INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_user_id ON telecom_user_activity_log(user_id);
CREATE INDEX idx_timestamp ON telecom_user_activity_log(timestamp);
CREATE INDEX idx_fraud ON telecom_user_activity_log(is_spam_or_fraud);
CREATE INDEX idx_activity_type ON telecom_user_activity_log(activity_type);
```

### Step 3: Import Your CSV Data
Use PostgreSQL COPY command or a CSV import tool:

```sql
COPY telecom_user_activity_log(user_id, timestamp, activity_type, direction, peer_number, duration_sec, location, network_type, is_roaming, is_spam_or_fraud)
FROM '/path/to/your/data.csv'
DELIMITER ','
CSV HEADER;
```

## Option 3: Database Configuration
Update the database connection in `server/storage.ts`:

```typescript
// Replace the neon connection with standard PostgreSQL
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Or individual connection params:
  host: 'localhost',
  port: 5432,
  database: 'your_database_name',
  user: 'your_username',
  password: 'your_password',
});

const db = drizzle(pool);
```

## Data Format Requirements
Your CSV data should have these columns:
- user_id (string)
- timestamp (ISO date format)
- activity_type ('call' or 'sms')
- direction ('incoming' or 'outgoing')  
- peer_number (phone number)
- duration_sec (integer, for calls)
- location (city/region name)
- network_type ('2G', '3G', '4G', '5G')
- is_roaming ('yes' or 'no')
- is_spam_or_fraud (0 or 1)

## Testing Connection
After updating your DATABASE_URL, restart the application and verify:
1. Navigate to /telecom-analytics
2. Check that data loads correctly
3. Verify API endpoints return your data:
   - /api/telecom/activities
   - /api/telecom/stats
   - /api/telecom/fraud-activities
   - /api/telecom/user-risk/:userId