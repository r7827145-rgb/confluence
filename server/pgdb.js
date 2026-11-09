const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const CONNECTION_STRING = process.env.DATABASE_URL || 'postgresql://postgres.arglvmflaxgmxxerwzgt:4pKbGz3blLTYZGym@aws-0-eu-west-1.pooler.supabase.com:5432/postgres';

const pool = new Pool({
  connectionString: CONNECTION_STRING,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

// Initialize Schema
async function initDb() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Confluence Sessions Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.confluence_sessions (
        id VARCHAR(100) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        subtitle TEXT,
        speaker VARCHAR(255),
        speaker_role VARCHAR(255),
        venue VARCHAR(100) NOT NULL,
        session_date VARCHAR(50) DEFAULT '2026-11-09',
        start_time VARCHAR(50),
        end_time VARCHAR(50),
        time_slot VARCHAR(100),
        quota INT DEFAULT 100,
        category VARCHAR(100) DEFAULT 'General',
        tag_color VARCHAR(50) DEFAULT 'orange',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Confluence Students Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.confluence_students (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        class_name VARCHAR(100) NOT NULL,
        roll_no VARCHAR(50),
        phone VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Confluence Registrations Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.confluence_registrations (
        id VARCHAR(100) PRIMARY KEY,
        student_id VARCHAR(100) NOT NULL,
        student_name VARCHAR(255),
        student_class VARCHAR(100),
        session_id VARCHAR(100) NOT NULL,
        session_title VARCHAR(255),
        venue VARCHAR(100),
        time_slot VARCHAR(100),
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query('COMMIT');
    console.log('✅ Supabase PostgreSQL schema initialized & ready!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error initializing PostgreSQL schema:', err);
    throw err;
  } finally {
    client.release();
  }
}

// ---------------- API QUERY HELPERS ----------------

async function getSessions() {
  const query = `
    SELECT 
      s.id,
      s.title,
      s.subtitle,
      s.speaker,
      s.speaker_role as "speakerRole",
      s.venue,
      s.session_date as "date",
      s.start_time as "startTime",
      s.end_time as "endTime",
      s.time_slot as "timeSlot",
      s.quota,
      s.category,
      s.tag_color as "tagColor",
      s.description,
      COUNT(r.id)::int as "registeredCount"
    FROM public.confluence_sessions s
    LEFT JOIN public.confluence_registrations r ON s.id = r.session_id
    GROUP BY s.id
    ORDER BY s.start_time ASC, s.id ASC;
  `;
  const { rows } = await pool.query(query);

  return rows.map(s => {
    const quota = parseInt(s.quota, 10) || 0;
    const registered = parseInt(s.registeredCount, 10) || 0;
    const remaining = Math.max(0, quota - registered);
    const isFull = registered >= quota;
    const percentFilled = quota > 0 ? Math.min(100, Math.round((registered / quota) * 100)) : 0;
    return {
      ...s,
      registeredCount: registered,
      remainingQuota: remaining,
      isFull,
      percentFilled
    };
  });
}

async function createSession(data) {
  const { title, subtitle, speaker, speakerRole, venue, date, startTime, endTime, quota, category, description } = data;
  const timeSlot = (startTime && endTime) ? `${startTime} - ${endTime}` : (data.timeSlot || 'TBD');
  const id = `sess-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const query = `
    INSERT INTO public.confluence_sessions (id, title, subtitle, speaker, speaker_role, venue, session_date, start_time, end_time, time_slot, quota, category, description)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING id, title, subtitle, speaker, speaker_role as "speakerRole", venue, session_date as "date", start_time as "startTime", end_time as "endTime", time_slot as "timeSlot", quota, category, description;
  `;
  const values = [id, title.trim(), (subtitle || '').trim(), (speaker || 'TBD').trim(), (speakerRole || '').trim(), venue.trim(), date || '2026-11-09', startTime || '', endTime || '', timeSlot, Math.max(1, parseInt(quota, 10)), category || 'General', (description || '').trim()];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

async function updateSession(id, data) {
  const { title, subtitle, speaker, speakerRole, venue, date, startTime, endTime, quota, category, description } = data;
  const timeSlot = (startTime && endTime) ? `${startTime} - ${endTime}` : (data.timeSlot || undefined);

  const query = `
    UPDATE public.confluence_sessions
    SET 
      title = COALESCE($2, title),
      subtitle = COALESCE($3, subtitle),
      speaker = COALESCE($4, speaker),
      speaker_role = COALESCE($5, speaker_role),
      venue = COALESCE($6, venue),
      session_date = COALESCE($7, session_date),
      start_time = COALESCE($8, start_time),
      end_time = COALESCE($9, end_time),
      time_slot = COALESCE($10, time_slot),
      quota = COALESCE($11, quota),
      category = COALESCE($12, category),
      description = COALESCE($13, description)
    WHERE id = $1
    RETURNING id, title, subtitle, speaker, speaker_role as "speakerRole", venue, session_date as "date", start_time as "startTime", end_time as "endTime", time_slot as "timeSlot", quota, category, description;
  `;
  const values = [id, title, subtitle, speaker, speakerRole, venue, date, startTime, endTime, timeSlot, quota ? parseInt(quota, 10) : undefined, category, description];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

async function deleteSession(id) {
  await pool.query('DELETE FROM public.confluence_registrations WHERE session_id = $1', [id]);
  const res = await pool.query('DELETE FROM public.confluence_sessions WHERE id = $1', [id]);
  return res.rowCount > 0;
}

async function getStudents(queryText) {
  if (queryText) {
    const q = `%${queryText.toLowerCase().trim()}%`;
    const { rows } = await pool.query(`
      SELECT id, name, class_name as "className", roll_no as "rollNo", phone
      FROM public.confluence_students
      WHERE LOWER(name) LIKE $1 OR LOWER(class_name) LIKE $1 OR LOWER(id) LIKE $1 OR LOWER(roll_no) LIKE $1
      ORDER BY name ASC
      LIMIT 50;
    `, [q]);
    return rows;
  }
  const { rows } = await pool.query(`
    SELECT id, name, class_name as "className", roll_no as "rollNo", phone
    FROM public.confluence_students
    ORDER BY name ASC;
  `);
  return rows;
}

async function createStudent(data) {
  const { name, className, rollNo, phone } = data;
  const { rows: countRows } = await pool.query('SELECT COUNT(*) FROM public.confluence_students');
  const id = `STU-${1000 + parseInt(countRows[0].count, 10) + 1}`;

  const query = `
    INSERT INTO public.confluence_students (id, name, class_name, roll_no, phone)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, name, class_name as "className", roll_no as "rollNo", phone;
  `;
  const { rows } = await pool.query(query, [id, name.trim(), className.trim(), (rollNo || '').trim(), (phone || '').trim()]);
  return rows[0];
}

async function bulkInsertStudents(rawRows, fallbackClass = 'General') {
  const client = await pool.connect();
  let addedCount = 0;
  const sample = [];

  try {
    await client.query('BEGIN');
    const { rows: existingRows } = await client.query('SELECT LOWER(name) as name, LOWER(class_name) as class_name FROM public.confluence_students');
    const existingSet = new Set(existingRows.map(r => `${r.name}_${r.class_name}`));

    const { rows: countRows } = await client.query('SELECT COUNT(*) FROM public.confluence_students');
    let currentCount = parseInt(countRows[0].count, 10);

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const keys = Object.keys(row);
      const nameKey = keys.find(k => /name|student\s*name/i.test(k)) || keys[0];
      const classKey = keys.find(k => /class|grade|div|batch|division/i.test(k));
      const rollKey = keys.find(k => /roll|reg|id|sl\s*no|number/i.test(k));
      const phoneKey = keys.find(k => /phone|mobile|contact/i.test(k));

      const nameVal = row[nameKey] ? String(row[nameKey]).trim() : '';
      const classVal = (classKey && row[classKey] && classKey !== nameKey) ? String(row[classKey]).trim() : (fallbackClass || 'General');
      const rollVal = (rollKey && row[rollKey]) ? String(row[rollKey]).trim() : String(i + 1);
      const phoneVal = (phoneKey && row[phoneKey]) ? String(row[phoneKey]).trim() : '';

      if (nameVal && nameVal.length >= 2) {
        const key = `${nameVal.toLowerCase()}_${classVal.toLowerCase()}`;
        if (!existingSet.has(key)) {
          existingSet.add(key);
          currentCount++;
          const id = `STU-${1000 + currentCount}`;

          await client.query(`
            INSERT INTO public.confluence_students (id, name, class_name, roll_no, phone)
            VALUES ($1, $2, $3, $4, $5);
          `, [id, nameVal, classVal, rollVal, phoneVal]);

          addedCount++;
          if (sample.length < 5) {
            sample.push({ id, name: nameVal, className: classVal, rollNo: rollVal });
          }
        }
      }
    }

    await client.query('COMMIT');
    return { addedCount, sample };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function deleteStudent(id) {
  await pool.query('DELETE FROM public.confluence_registrations WHERE student_id = $1', [id]);
  const res = await pool.query('DELETE FROM public.confluence_students WHERE id = $1', [id]);
  return res.rowCount > 0;
}

async function getRegistrations(filter = {}) {
  let query = `
    SELECT 
      id,
      student_id as "studentId",
      student_name as "studentName",
      student_class as "studentClass",
      session_id as "sessionId",
      session_title as "sessionTitle",
      venue,
      time_slot as "timeSlot",
      registered_at as "registeredAt"
    FROM public.confluence_registrations
  `;
  const params = [];
  if (filter.sessionId && filter.studentId) {
    query += ` WHERE session_id = $1 AND student_id = $2`;
    params.push(filter.sessionId, filter.studentId);
  } else if (filter.sessionId) {
    query += ` WHERE session_id = $1`;
    params.push(filter.sessionId);
  } else if (filter.studentId) {
    query += ` WHERE student_id = $1`;
    params.push(filter.studentId);
  }
  query += ` ORDER BY registered_at DESC;`;

  const { rows } = await pool.query(query, params);
  return rows;
}

async function registerBatch(studentId, sessionIds) {
  // 1. Fetch student, all sessions, and student's existing registrations concurrently on the pool
  const [stRes, allSessRes, existingRegsRes] = await Promise.all([
    pool.query('SELECT * FROM public.confluence_students WHERE id = $1', [studentId]),
    pool.query('SELECT * FROM public.confluence_sessions'),
    pool.query('SELECT * FROM public.confluence_registrations WHERE student_id = $1', [studentId])
  ]);

  if (stRes.rows.length === 0) {
    throw new Error('Selected student not found in roster.');
  }
  const student = stRes.rows[0];
  const existingRegs = existingRegsRes.rows;

    // Match sessions by ID or title (resilient to re-seeding or ID changes)
    const matchedSessions = [];
    for (const reqId of sessionIds) {
      const found = allSessRes.rows.find(s => s.id === reqId || s.title.toLowerCase() === reqId.toLowerCase());
      if (found) {
        matchedSessions.push(found);
      }
    }

    if (matchedSessions.length === 0) {
      throw new Error('No matching sessions found to register.');
    }

    // 2. In-memory time slot conflict check among selected sessions (0ms)
    const slotMap = {};
    for (const s of matchedSessions) {
      if (s.time_slot && s.time_slot !== 'TBD') {
        if (slotMap[s.time_slot]) {
          throw new Error(`⚠️ Time Conflict: You picked both "${slotMap[s.time_slot].title}" and "${s.title}" at ${s.time_slot}. Please pick one.`);
        }
        slotMap[s.time_slot] = s;
      }
    }

    // 3. Existing student registration checks (0ms)
    for (const s of matchedSessions) {
      if (existingRegs.some(r => r.session_id === s.id)) {
        throw new Error(`⚠️ "${student.name}" is ALREADY registered for "${s.title}".`);
      }
      if (s.time_slot && s.time_slot !== 'TBD') {
        const conflict = existingRegs.find(r => r.time_slot === s.time_slot);
        if (conflict) {
          throw new Error(`⚠️ Time Conflict: "${student.name}" is already registered for "${conflict.session_title}" at ${s.time_slot}.`);
        }
      }
    }

    // 4. Batch quota check in 1 query for all matched sessions
    const matchedIds = matchedSessions.map(s => s.id);
    const { rows: countRows } = await pool.query(
      'SELECT session_id, count(*)::int as count FROM public.confluence_registrations WHERE session_id = ANY($1) GROUP BY session_id',
      [matchedIds]
    );
    const countMap = {};
    countRows.forEach(c => { countMap[c.session_id] = c.count; });

    for (const s of matchedSessions) {
      const quota = parseInt(s.quota, 10);
      const current = countMap[s.id] || 0;
      // If quota is set (and not open/unlimited > 500), enforce it
      if (quota > 0 && quota < 500 && current >= quota) {
        throw new Error(`⚠️ Quota Reached! "${s.title}" has filled all ${quota} seats.`);
      }
    }

    // 5. Single BATCH INSERT in 1 fast transaction!
    const values = [];
    const placeholders = [];
    let pIdx = 1;
    const nowTime = Date.now().toString().slice(-4);

    matchedSessions.forEach((session, i) => {
      const regId = `REG-${nowTime}${Math.floor(Math.random() * 90 + 10)}-${i + 1}`;
      placeholders.push(`($${pIdx}, $${pIdx + 1}, $${pIdx + 2}, $${pIdx + 3}, $${pIdx + 4}, $${pIdx + 5}, $${pIdx + 6}, $${pIdx + 7})`);
      values.push(regId, student.id, student.name, student.class_name, session.id, session.title, session.venue, session.time_slot);
      pIdx += 8;
    });

    const insertQuery = `
      INSERT INTO public.confluence_registrations (id, student_id, student_name, student_class, session_id, session_title, venue, time_slot)
      VALUES ${placeholders.join(', ')}
      RETURNING id, student_id as "studentId", student_name as "studentName", student_class as "studentClass", session_id as "sessionId", session_title as "sessionTitle", venue, time_slot as "timeSlot", registered_at as "registeredAt";
    `;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows: created } = await client.query(insertQuery, values);
      await client.query('COMMIT');
      return { student, created };
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
}

async function deleteRegistration(id) {
  const res = await pool.query('DELETE FROM public.confluence_registrations WHERE id = $1', [id]);
  return res.rowCount > 0;
}

async function deleteStudentRegistrations(studentId) {
  const res = await pool.query('DELETE FROM public.confluence_registrations WHERE student_id = $1', [studentId]);
  return res.rowCount;
}

module.exports = {
  pool,
  initDb,
  getSessions,
  createSession,
  updateSession,
  deleteSession,
  getStudents,
  createStudent,
  bulkInsertStudents,
  deleteStudent,
  getRegistrations,
  registerBatch,
  deleteRegistration,
  deleteStudentRegistrations
};
