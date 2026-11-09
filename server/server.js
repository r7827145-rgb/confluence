const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const pgdb = require('./pgdb');

const app = express();
const PORT = process.env.PORT || 4000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Configure Multer for Excel file uploads in-memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// ----------------- API ROUTES (POSTGRESQL POWERED) -----------------

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'PostgreSQL (Supabase)', timestamp: new Date().toISOString() });
});

// 2. Get all sessions with live quota and registration counts
app.get('/api/sessions', async (req, res) => {
  try {
    const sessions = await pgdb.getSessions();
    res.json(sessions);
  } catch (err) {
    console.error("Error fetching sessions:", err);
    res.status(500).json({ error: "Failed to fetch sessions from database." });
  }
});

// 3. Create a new session
app.post('/api/sessions', async (req, res) => {
  try {
    const { title, venue, quota } = req.body;
    if (!title || !venue || !quota) {
      return res.status(400).json({ error: 'Title, Venue, and Quota are required fields.' });
    }

    const session = await pgdb.createSession(req.body);
    res.status(201).json({ message: 'Session created successfully in PostgreSQL', session });
  } catch (err) {
    console.error("Error creating session:", err);
    res.status(500).json({ error: err.message || "Failed to create session." });
  }
});

// 4. Update an existing session
app.put('/api/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const session = await pgdb.updateSession(id, req.body);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json({ message: 'Session updated successfully in PostgreSQL', session });
  } catch (err) {
    console.error("Error updating session:", err);
    res.status(500).json({ error: err.message || "Failed to update session." });
  }
});

// 5. Delete session
app.delete('/api/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await pgdb.deleteSession(id);
    if (!success) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json({ message: 'Session and associated registrations deleted successfully from PostgreSQL' });
  } catch (err) {
    console.error("Error deleting session:", err);
    res.status(500).json({ error: err.message || "Failed to delete session." });
  }
});

// 6. Search or list students
app.get('/api/students', async (req, res) => {
  try {
    const { query } = req.query;
    const students = await pgdb.getStudents(query);
    res.json(students);
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ error: "Failed to fetch students from database." });
  }
});

// 7. Add single student
app.post('/api/students', async (req, res) => {
  try {
    const { name, className } = req.body;
    if (!name || !className) {
      return res.status(400).json({ error: 'Student Name and Class are required' });
    }

    const student = await pgdb.createStudent(req.body);
    res.status(201).json({ message: 'Student added successfully to PostgreSQL', student });
  } catch (err) {
    console.error("Error creating student:", err);
    res.status(500).json({ error: err.message || "Failed to create student." });
  }
});

// 8. Bulk upload students via Excel (.xlsx, .xls) or CSV
app.post('/api/students/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an Excel or CSV file.' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (!rawRows || rawRows.length === 0) {
      return res.status(400).json({ error: 'The uploaded file contains no data rows.' });
    }

    // Determine fallback class from filename (e.g. C2C.xlsx -> C2C, c1b.xlsx -> C1B) or sheet name
    const rawFilename = (req.file.originalname || '').replace(/\.[^/.]+$/, "").trim();
    const classMatch = rawFilename.match(/c[1-2][a-c]/i) || firstSheetName.match(/c[1-2][a-c]/i);
    const fallbackClass = classMatch ? classMatch[0].toUpperCase() : (req.body.className || 'General');

    const { addedCount, sample } = await pgdb.bulkInsertStudents(rawRows, fallbackClass);
    const allStudents = await pgdb.getStudents();

    res.json({
      message: `Successfully imported ${addedCount} student(s) into PostgreSQL database.`,
      addedCount,
      totalStudents: allStudents.length,
      sample
    });
  } catch (err) {
    console.error("Excel upload error:", err);
    res.status(500).json({ error: 'Failed to parse Excel file into PostgreSQL.' });
  }
});

// 9. Download sample Excel template
app.get('/api/students/sample-template', (req, res) => {
  const sampleData = [
    { "Name": "Muhammed Raihan", "Class": "C2C", "Roll No": "101", "Phone": "9876543210" },
    { "Name": "Fathima Nihala", "Class": "C2C", "Roll No": "102", "Phone": "9876543211" },
    { "Name": "Arjun Krishnan", "Class": "C2B", "Roll No": "103", "Phone": "9876543212" },
    { "Name": "Diya Parveen", "Class": "C1C", "Roll No": "104", "Phone": "9876543213" },
    { "Name": "Bilal Ahmed", "Class": "C1C", "Roll No": "105", "Phone": "9876543214" }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Students");

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename="Students_Upload_Template.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
});

// 10. Delete a student
app.delete('/api/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pgdb.deleteStudent(id);
    res.json({ message: 'Student and associated registrations removed from PostgreSQL.' });
  } catch (err) {
    console.error("Error deleting student:", err);
    res.status(500).json({ error: "Failed to delete student." });
  }
});

// 11. Student Registration Endpoint (supports single sessionId or batch sessionIds)
app.post('/api/registrations', async (req, res) => {
  try {
    const { studentId, sessionId, sessionIds } = req.body;
    if (!studentId || (!sessionId && (!sessionIds || !sessionIds.length))) {
      return res.status(400).json({ error: 'studentId and at least one session are required.' });
    }

    const targetSessionIds = sessionIds && Array.isArray(sessionIds) ? sessionIds : [sessionId];
    const { student, created } = await pgdb.registerBatch(studentId, targetSessionIds);

    res.status(201).json({
      message: `🎉 Successfully registered ${student.name} for ${created.length} session(s) in PostgreSQL!`,
      registrations: created,
      registration: created[0],
      count: created.length
    });
  } catch (err) {
    console.warn("Registration validation/error:", err.message);
    res.status(400).json({ error: err.message || 'Registration failed.' });
  }
});

// 12. Get all registrations (optional filter by sessionId or studentId)
app.get('/api/registrations', async (req, res) => {
  try {
    const { sessionId, studentId } = req.query;
    const registrations = await pgdb.getRegistrations({ sessionId, studentId });
    res.json(registrations);
  } catch (err) {
    console.error("Error fetching registrations:", err);
    res.status(500).json({ error: "Failed to fetch registrations." });
  }
});

// 13. Cancel a registration
app.delete('/api/registrations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await pgdb.deleteRegistration(id);
    if (!success) {
      return res.status(404).json({ error: 'Registration not found' });
    }
    res.json({ message: 'Registration cancelled successfully. Seat has been freed up.' });
  } catch (err) {
    console.error("Error cancelling registration:", err);
    res.status(500).json({ error: "Failed to cancel registration." });
  }
});

// 13b. Cancel all registrations for a student
app.delete('/api/registrations/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const count = await pgdb.deleteStudentRegistrations(studentId);
    res.json({ message: `Successfully cancelled ${count} registration(s) for student. Seats have been freed up.`, count });
  } catch (err) {
    console.error("Error cancelling student registrations:", err);
    res.status(500).json({ error: "Failed to cancel student registrations." });
  }
});

// 14. EXCEL EXPORT: Download registered students for a specific session as Excel (.xlsx)
app.get('/api/export/session/:sessionId/excel', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const sessions = await pgdb.getSessions();
    const session = sessions.find(s => s.id === sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const sessionRegs = await pgdb.getRegistrations({ sessionId });
    const students = await pgdb.getStudents();

    const exportData = sessionRegs.map((r, idx) => {
      const st = students.find(s => s.id === r.studentId);
      return {
        "Sl No": idx + 1,
        "Pass ID": r.id,
        "Student ID": r.studentId,
        "Student Name": r.studentName,
        "Class / Grade": r.studentClass,
        "Roll No": st ? st.rollNo : '',
        "Phone": st ? st.phone : '',
        "Session": session.title,
        "Venue": session.venue,
        "Time Slot": session.timeSlot,
        "Registration Date": new Date(r.registeredAt).toLocaleString('en-IN')
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData.length > 0 ? exportData : [
      { "Note": "No students registered for this session yet." }
    ]);

    ws['!cols'] = [
      { wch: 8 }, { wch: 14 }, { wch: 14 }, { wch: 25 }, { wch: 15 },
      { wch: 10 }, { wch: 14 }, { wch: 30 }, { wch: 18 }, { wch: 22 }, { wch: 22 }
    ];

    const wb = XLSX.utils.book_new();
    const safeTitle = session.title.replace(/[\\/*?[\]:]/g, '').slice(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, safeTitle || "Attendees");

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `${session.title.replace(/\s+/g, '_')}_Attendees.xlsx`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) {
    console.error("Excel export error:", err);
    res.status(500).json({ error: "Failed to generate Excel export." });
  }
});

// 15. EXCEL EXPORT: Master Excel with all sessions & summary
app.get('/api/export/master/excel', async (req, res) => {
  try {
    const sessions = await pgdb.getSessions();
    const registrations = await pgdb.getRegistrations();
    const students = await pgdb.getStudents();

    const wb = XLSX.utils.book_new();

    // Sheet 1: Sessions Summary
    const summaryData = sessions.map((s, idx) => ({
      "Sl": idx + 1,
      "Session Title": s.title,
      "Venue": s.venue,
      "Time Slot": s.timeSlot,
      "Speaker": s.speaker,
      "Quota": s.quota,
      "Registered": s.registeredCount,
      "Seats Left": s.remainingQuota,
      "Fill Rate": `${s.percentFilled}%`,
      "Status": s.isFull ? "FULL / CLOSED" : "OPEN"
    }));
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary & Quotas");

    // Sheet 2: All Registrations Master List
    const allRegsData = registrations.map((r, idx) => {
      const st = students.find(s => s.id === r.studentId);
      return {
        "Sl": idx + 1,
        "Pass ID": r.id,
        "Student Name": r.studentName,
        "Class": r.studentClass,
        "Roll No": st ? st.rollNo : '',
        "Session Title": r.sessionTitle,
        "Venue": r.venue,
        "Time Slot": r.timeSlot,
        "Registered At": new Date(r.registeredAt).toLocaleString('en-IN')
      };
    });
    const wsAllRegs = XLSX.utils.json_to_sheet(allRegsData);
    XLSX.utils.book_append_sheet(wb, wsAllRegs, "All Registrations");

    // Individual sheets for each session
    sessions.forEach(sess => {
      const sRegs = registrations.filter(r => r.sessionId === sess.id);
      const rows = sRegs.map((r, i) => ({
        "Sl": i + 1,
        "Pass ID": r.id,
        "Student Name": r.studentName,
        "Class": r.studentClass,
        "Time": new Date(r.registeredAt).toLocaleTimeString('en-IN')
      }));
      const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ "Status": "No registrations" }]);
      const cleanSheetName = sess.title.replace(/[\\/*?[\]:]/g, '').slice(0, 30);
      XLSX.utils.book_append_sheet(wb, ws, cleanSheetName);
    });

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="CONFLUENCE_Master_Registrations.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) {
    console.error("Master Excel export error:", err);
    res.status(500).json({ error: "Failed to generate master Excel." });
  }
});

// 15b. EXCEL EXPORT: Each Student and their Participated Sessions
app.get('/api/export/students-participation/excel', async (req, res) => {
  try {
    const students = await pgdb.getStudents();
    const registrations = await pgdb.getRegistrations();

    const reportData = students.map((st, idx) => {
      const studentRegs = registrations.filter(r => r.studentId === st.id);
      const sessionTitles = studentRegs.map(r => `${r.sessionTitle} (${r.venue})`).join(', ');
      const timeSlots = studentRegs.map(r => r.timeSlot).join(', ');
      const passIds = studentRegs.map(r => r.id).join(', ');

      return {
        "Sl No": idx + 1,
        "Student ID": st.id,
        "Student Name": st.name,
        "Class / Grade": st.className,
        "Roll No": st.rollNo || '-',
        "Phone": st.phone || '-',
        "Total Sessions Attended": studentRegs.length,
        "Participated Sessions": sessionTitles || 'None (Not registered yet)',
        "Time Slots": timeSlots || '-',
        "Pass IDs": passIds || '-'
      };
    });

    const ws = XLSX.utils.json_to_sheet(reportData);
    ws['!cols'] = [
      { wch: 8 }, { wch: 14 }, { wch: 25 }, { wch: 18 }, { wch: 10 },
      { wch: 14 }, { wch: 22 }, { wch: 55 }, { wch: 35 }, { wch: 25 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Student Participation");

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="CONFLUENCE_Students_Participation_Report.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) {
    console.error("Student participation export error:", err);
    res.status(500).json({ error: "Failed to generate student participation Excel." });
  }
});

// 16. Summary & Analytics API
app.get('/api/stats', async (req, res) => {
  try {
    const sessions = await pgdb.getSessions();
    const students = await pgdb.getStudents();
    const registrations = await pgdb.getRegistrations();

    const totalSessions = sessions.length;
    const totalStudents = students.length;
    const totalRegistrations = registrations.length;
    const totalSeats = sessions.reduce((acc, s) => acc + (parseInt(s.quota) || 0), 0);
    const fullSessionsCount = sessions.filter(s => s.isFull).length;

    res.json({
      totalSessions,
      totalStudents,
      totalRegistrations,
      totalSeats,
      fullSessionsCount,
      sessions
    });
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ error: "Failed to fetch stats." });
  }
});

// Middleware to ensure DB connection is initialized on serverless (e.g. Vercel)
let dbInitialized = false;
app.use(async (req, res, next) => {
  if (!dbInitialized) {
    try {
      await pgdb.initDb();
      dbInitialized = true;
    } catch (e) {
      console.warn("DB init notice:", e.message);
    }
  }
  next();
});

// Fallback to index.html for single-page app routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Start Server with PostgreSQL Initialization (Local / Dedicated Server)
async function startServer() {
  try {
    await pgdb.initDb();
    dbInitialized = true;
    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 Confluence Portal Running on PostgreSQL (Supabase)!`);
      console.log(`🔗 URL: http://localhost:${PORT}`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error("Fatal error starting server with PostgreSQL:", err);
    process.exit(1);
  }
}

if (!process.env.VERCEL) {
  startServer();
}

module.exports = app;
