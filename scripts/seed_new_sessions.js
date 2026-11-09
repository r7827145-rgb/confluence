const { Pool } = require('pg');

const CONNECTION_STRING = process.env.DATABASE_URL || 'postgresql://postgres.arglvmflaxgmxxerwzgt:4pKbGz3blLTYZGym@aws-0-eu-west-1.pooler.supabase.com:5432/postgres';

const pool = new Pool({
  connectionString: CONNECTION_STRING,
  ssl: { rejectUnauthorized: false }
});

const officialSessions = [
  {
    id: "sess-market-mind",
    title: "MARKET MIND",
    subtitle: "Understanding Stocks, Shares & Investments",
    speaker: "SHABEER AROOR",
    speakerRole: "HSST, Rahmania HS School",
    venue: "Incubator",
    date: "2026-11-10",
    startTime: "09:00 AM",
    endTime: "10:30 AM",
    timeSlot: "09:00 AM - 10:30 AM",
    quota: 0, // 0 = Open / Dynamic Quota (No hardcoded limit)
    category: "Incubator",
    tagColor: "cyan",
    description: "Deep dive into financial markets, stock valuation, equity investments, and wealth fundamentals."
  },
  {
    id: "sess-money-matters",
    title: "MONEY MATTERS",
    subtitle: "Mastering Personal Finance",
    speaker: "FAYAS AMHAD",
    speakerRole: "HOD, Sullamussalam Science College",
    venue: "Majlis",
    date: "2026-11-10",
    startTime: "09:00 AM",
    endTime: "10:30 AM",
    timeSlot: "09:00 AM - 10:30 AM",
    quota: 0,
    category: "Majlis",
    tagColor: "amber",
    description: "Practical guide to budgeting, wealth management, asset allocation, and financial freedom."
  },
  {
    id: "sess-beyond-ordinary",
    title: "BEYOND THE ORDINARY",
    subtitle: "Courage, Creativity & Entrepreneurship",
    speaker: "ASHEEKA KHADEEJA",
    speakerRole: "Founder, Rochie Chocolates",
    venue: "Main Stage",
    date: "2026-11-10",
    startTime: "09:00 AM",
    endTime: "10:30 AM",
    timeSlot: "09:00 AM - 10:30 AM",
    quota: 0,
    category: "General",
    tagColor: "orange",
    description: "An inspiring entrepreneurial journey on creative thinking, branding, and taking bold risks."
  },
  {
    id: "sess-art-influence",
    title: "THE ART OF INFLUENCE",
    subtitle: "Marketing Psychology & Brand Strategy",
    speaker: "NIZAMUDHEEN KC",
    speakerRole: "Founder, Ureka Marketing",
    venue: "Majlis",
    date: "2026-11-10",
    startTime: "10:30 AM",
    endTime: "12:00 PM",
    timeSlot: "10:30 AM - 12:00 PM",
    quota: 0,
    category: "Majlis",
    tagColor: "orange",
    description: "How psychology drives consumer behavior, brand perception, storytelling, and high-impact conversions."
  },
  {
    id: "sess-future-automated",
    title: "THE FUTURE IS AUTOMATED",
    subtitle: "AI Applications Across Commerce",
    speaker: "IRSHAD KK",
    speakerRole: "Founder, Bairuha Tech",
    venue: "Incubator",
    date: "2026-11-10",
    startTime: "10:30 AM",
    endTime: "12:00 PM",
    timeSlot: "10:30 AM - 12:00 PM",
    quota: 0,
    category: "Incubator",
    tagColor: "emerald",
    description: "Next-generation AI workflows, process automation, predictive analytics, and tech disruption in commerce."
  },
  {
    id: "sess-start-to-up",
    title: "START TO UP",
    subtitle: "The Art of Creating a Startup",
    speaker: "MUHAMMED FAWAS",
    speakerRole: "CEO, Hilite Mall",
    venue: "Majlis",
    date: "2026-11-10",
    startTime: "12:00 PM",
    endTime: "01:30 PM",
    timeSlot: "12:00 PM - 01:30 PM",
    quota: 0,
    category: "Majlis",
    tagColor: "orange",
    description: "Foundational playbook for building a scalable venture: idea validation, business models, and execution."
  },
  {
    id: "sess-hot-seat",
    title: "HOT SEAT",
    subtitle: "Live Business Challenges & Rapid-Fire Decisions",
    speaker: "Conclave Mentors",
    speakerRole: "Caliph Commerce Domain Conclave",
    venue: "Incubator",
    date: "2026-11-10",
    startTime: "12:00 PM",
    endTime: "01:30 PM",
    timeSlot: "12:00 PM - 01:30 PM",
    quota: 0,
    category: "Incubator",
    tagColor: "rose",
    description: "Intense rapid-fire decision-making simulation solving real-time crisis and market pressures."
  },
  {
    id: "sess-pacioli-team",
    title: "PACIOLI TEAM",
    subtitle: "Incubator & IF",
    speaker: "MOHAMMED ALTHAF K, CA UNAIS PERINGODAN, KHALID MOHAMMED",
    speakerRole: "Pacioli Team / Chartered Accountants",
    venue: "Incubator",
    date: "2026-11-10",
    startTime: "02:30 PM",
    endTime: "04:00 PM",
    timeSlot: "02:30 PM - 04:00 PM",
    quota: 0,
    category: "Incubator",
    tagColor: "cyan",
    description: "Accounting precision, audit standards, tax compliance, and investment governance for modern enterprises."
  },
  {
    id: "sess-beyond-breakdown",
    title: "BEYOND THE BREAKDOWN",
    subtitle: "Managing Crises Through Innovation",
    speaker: "MOOSA NAVAS",
    speakerRole: "Business Consultant & Strategist",
    venue: "Majlis",
    date: "2026-11-10",
    startTime: "02:30 PM",
    endTime: "04:00 PM",
    timeSlot: "02:30 PM - 04:00 PM",
    quota: 0,
    category: "Majlis",
    tagColor: "amber",
    description: "How resilient leaders navigate market downturns, restructure operations, and emerge stronger."
  }
];

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Clear and populate with stable IDs
    await client.query('DELETE FROM public.confluence_registrations');
    await client.query('DELETE FROM public.confluence_sessions');
    console.log('Cleared previous sessions.');

    for (const s of officialSessions) {
      await client.query(`
        INSERT INTO public.confluence_sessions (id, title, subtitle, speaker, speaker_role, venue, session_date, start_time, end_time, time_slot, quota, category, tag_color, description)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14);
      `, [s.id, s.title, s.subtitle, s.speaker, s.speakerRole, s.venue, s.date, s.startTime, s.endTime, s.timeSlot, s.quota, s.category, s.tagColor, s.description]);
    }

    await client.query('COMMIT');
    console.log(`✅ Successfully seeded ${officialSessions.length} official flyer sessions with dynamic open quotas!`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error inserting sessions:', err);
  } finally {
    client.release();
    pool.end();
  }
}

run();
