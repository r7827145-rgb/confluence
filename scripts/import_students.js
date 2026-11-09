const { Pool } = require('pg');
const xlsx = require('xlsx');
const path = require('path');

const CONNECTION_STRING = process.env.DATABASE_URL || 'postgresql://postgres.arglvmflaxgmxxerwzgt:4pKbGz3blLTYZGym@aws-0-eu-west-1.pooler.supabase.com:5432/postgres';

const pool = new Pool({
  connectionString: CONNECTION_STRING,
  ssl: { rejectUnauthorized: false }
});

const files = [
  { file: 'c1b.xlsx', className: 'C1B' },
  { file: 'C2C.xlsx', className: 'C2C' },
  { file: 'C2B.xlsx', className: 'C2B' },
  { file: 'c1c.xlsx', className: 'C1C' }
];

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM public.confluence_registrations');
    await client.query('DELETE FROM public.confluence_students');
    console.log('Cleared existing student table.');

    let total = 0;
    const summary = {};

    for (const f of files) {
      const p = path.join('C:', 'Users', 'mhdra', 'Downloads', f.file);
      const wb = xlsx.readFile(p);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = xlsx.utils.sheet_to_json(ws);
      summary[f.className] = 0;

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const roll = r['SL No'] || r['ROLL NO'] || r['ROLL'] || r['Roll No'] || r['Roll'] || (i + 1);
        const name = (r['Student Name'] || r['NAME'] || r['Name'] || '').toString().trim();

        if (name && name.length >= 2) {
          total++;
          summary[f.className]++;
          const id = `STU-${1000 + total}`;
          await client.query(
            `INSERT INTO public.confluence_students (id, name, class_name, roll_no, phone) VALUES ($1, $2, $3, $4, $5)`,
            [id, name, f.className, String(roll).trim(), '']
          );
        }
      }
    }

    await client.query('COMMIT');
    console.log('✅ Import complete! Total students added:', total);
    console.log('Class Breakdown:', JSON.stringify(summary));
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error importing students:', err);
  } finally {
    client.release();
    pool.end();
  }
}

run();

