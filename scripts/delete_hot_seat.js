const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.arglvmflaxgmxxerwzgt:4pKbGz3blLTYZGym@aws-0-eu-west-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await pool.query("DELETE FROM public.confluence_sessions WHERE id = 'sess-hot-seat' OR LOWER(title) LIKE '%hot seat%'");
  const res = await pool.query('SELECT id, title, speaker, venue, time_slot, quota FROM public.confluence_sessions ORDER BY start_time, title');
  console.log('✅ Exactly', res.rows.length, 'sessions in database:');
  console.table(res.rows);
  pool.end();
}

run();

