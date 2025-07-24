import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import fs from "fs";
import { parse } from "csv-parse/sync";
import { telecomUserActivityLog } from "../shared/schema.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

const sql = postgres(connectionString);
const db = drizzle(sql);

async function importCSV() {
  try {
    console.log("Reading CSV file...");
    const csvContent = fs.readFileSync("../attached_assets/jio_user_incoming_calls_sms_2000_1753289375252.csv", "utf-8");
    
    console.log("Parsing CSV data...");
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log(`Found ${records.length} records to import`);

    // Process records in batches
    const batchSize = 100;
    let imported = 0;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      const processedBatch = batch.map((record: any) => ({
        userId: record.user_id,
        timestamp: new Date(record.timestamp),
        activityType: record.activity_type,
        direction: record.direction,
        peerNumber: record.peer_number,
        durationSec: parseInt(record.duration_sec) || 0,
        location: record.location,
        deviceImei: record.device_imei,
        simImsi: record.sim_imsi,
        networkType: record.network_type,
        dataUsedMb: parseFloat(record.data_used_mb) || 0.0,
        isRoaming: record.is_roaming,
        isSpamOrFraud: parseInt(record.is_spam_or_fraud) || 0
      }));

      await db.insert(telecomUserActivityLog).values(processedBatch);
      imported += batch.length;
      console.log(`Imported ${imported}/${records.length} records...`);
    }

    console.log(`Successfully imported ${imported} records into telecom_user_activity_log table`);
  } catch (error) {
    console.error("Error importing CSV:", error);
  } finally {
    await sql.end();
  }
}

importCSV();