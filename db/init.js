require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.log('DATABASE_URL not set. Skipping database initialization.');
  process.exit(0);
}

async function initializeDatabase() {
  const client = new Client({ connectionString });
  await client.connect();

  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  await client.query(schemaSql);
  console.log('Database initialized successfully.');
  await client.end();
}

initializeDatabase().catch((error) => {
  console.error('Database initialization failed:', error.message);
  process.exit(1);
});
