const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initial seed data based on the Confluence event poster
const defaultData = {
  sessions: [
    {
      id: "sess-1",
      title: "Preface",
      subtitle: "Setting the Context for Confluence",
      speaker: "Keynote Speakers",
      speakerRole: "Caliph Commerce Domain Conclave",
      venue: "Main Auditorium",
      date: "2026-11-09",
      startTime: "11:30 AM",
      endTime: "12:00 PM",
      timeSlot: "11:30 AM - 12:00 PM",
      quota: 250,
      category: "General",
      tagColor: "orange",
      description: "Opening address setting the vision and framework for Confluence 2026."
    },
    {
      id: "sess-2",
      title: "The Economics of Power",
      subtitle: "How Money, Resources & Politics Shape the World",
      speaker: "Faiz Narkashi",
      speakerRole: "Principal, Caliph Life School",
      venue: "Majlis",
      date: "2026-11-09",
      startTime: "12:00 PM",
      endTime: "01:30 PM",
      timeSlot: "12:00 PM - 01:30 PM",
      quota: 85,
      category: "Majlis",
      tagColor: "orange",
      description: "An in-depth discourse on geopolitical economics, power dynamics, and market influence."
    },
    {
      id: "sess-3",
      title: "Elevate Your Skills",
      subtitle: "Personal Growth, Skill Development & Self-Improvement",
      speaker: "Bishr KC",
      speakerRole: "CEO, Skillage Academy",
      venue: "Majlis",
      date: "2026-11-09",
      startTime: "02:30 PM",
      endTime: "04:00 PM",
      timeSlot: "02:30 PM - 04:00 PM",
      quota: 80,
      category: "Majlis",
      tagColor: "amber",
      description: "Master essential professional competencies, public speaking, leadership, and personal branding."
    },
    {
      id: "sess-4",
      title: "Beyond Savings",
      subtitle: "Discovering the World of Stock Market Investing",
      speaker: "Basheer Ahammed.EK",
      speakerRole: "Stock Market Expert",
      venue: "Incubator",
      date: "2026-11-09",
      startTime: "02:30 PM",
      endTime: "04:00 PM",
      timeSlot: "02:30 PM - 04:00 PM",
      quota: 65,
      category: "Incubator",
      tagColor: "cyan",
      description: "Practical insights into equity investment, market analysis, portfolio risk, and wealth creation."
    },
    {
      id: "sess-5",
      title: "Games & Strategic Arena",
      subtitle: "Team Challenges, Quick Tasks & Strategy Games",
      speaker: "Conclave Mentors",
      speakerRole: "Caliph Commerce Conclave",
      venue: "Activity Arena",
      date: "2026-11-09",
      startTime: "04:30 PM",
      endTime: "05:30 PM",
      timeSlot: "04:30 PM - 05:30 PM",
      quota: 120,
      category: "Games",
      tagColor: "purple",
      description: "Gamified commerce puzzles, real-time crisis simulations, and rapid team decision making."
    },
    {
      id: "sess-6",
      title: "The CEO Mindset",
      subtitle: "How Vision, Leadership and Decisions Shape Success",
      speaker: "Azeem Panoli",
      speakerRole: "CEO, Aimer B School",
      venue: "Incubator",
      date: "2026-11-09",
      startTime: "07:00 PM",
      endTime: "08:30 PM",
      timeSlot: "07:00 PM - 08:30 PM",
      quota: 60,
      category: "Incubator",
      tagColor: "emerald",
      description: "Strategic decision-making frameworks, scaling business models, and leading high-performance teams."
    },
    {
      id: "sess-7",
      title: "From Idea to Empire",
      subtitle: "The Roadmap to Building a Startup",
      speaker: "Adv.CS. Hashim Wafa",
      speakerRole: "Founder, Legacy Partner & Corporate Lawyer",
      venue: "Majlis",
      date: "2026-11-09",
      startTime: "07:00 PM",
      endTime: "08:30 PM",
      timeSlot: "07:00 PM - 08:30 PM",
      quota: 85,
      category: "Majlis",
      tagColor: "orange",
      description: "Legal foundations, fundraising dynamics, intellectual property, and venture governance."
    },
    {
      id: "sess-8",
      title: "Cultural Night",
      subtitle: "A Celebration of Talent and Expression",
      speaker: "Student Artists & Guests",
      speakerRole: "Caliph Domain Conclave",
      venue: "Open Stage",
      date: "2026-11-09",
      startTime: "09:00 PM",
      endTime: "09:30 PM",
      timeSlot: "09:00 PM - 09:30 PM",
      quota: 300,
      category: "Cultural",
      tagColor: "rose",
      description: "An evening of artistic performances, stage talent, music, and conclave celebrations."
    }
  ],
  students: [
    { id: "STU-1001", name: "Aflah Rahman", className: "12-Commerce A", rollNo: "01", phone: "9847112233" },
    { id: "STU-1002", name: "Fathima Nihala", className: "12-Commerce A", rollNo: "02", phone: "9847112234" },
    { id: "STU-1003", name: "Mohammed Shamil", className: "12-Commerce A", rollNo: "03", phone: "9847112235" },
    { id: "STU-1004", name: "Rana Mariyam", className: "12-Commerce B", rollNo: "04", phone: "9847112236" },
    { id: "STU-1005", name: "Arjun Krishnan", className: "12-Commerce B", rollNo: "05", phone: "9847112237" },
    { id: "STU-1006", name: "Aysha Hiba", className: "11-Commerce", rollNo: "06", phone: "9847112238" },
    { id: "STU-1007", name: "Zayan Farhan", className: "11-Commerce", rollNo: "07", phone: "9847112239" },
    { id: "STU-1008", name: "Diya Parveen", className: "11-Commerce", rollNo: "08", phone: "9847112240" },
    { id: "STU-1009", name: "Bilal Ahmed", className: "B.Com 1st Year", rollNo: "09", phone: "9847112241" },
    { id: "STU-1010", name: "Hanna K", className: "B.Com 1st Year", rollNo: "10", phone: "9847112242" }
  ],
  registrations: [
    {
      id: "REG-2001",
      studentId: "STU-1001",
      studentName: "Aflah Rahman",
      studentClass: "12-Commerce A",
      sessionId: "sess-2",
      sessionTitle: "The Economics of Power",
      venue: "Majlis",
      timeSlot: "12:00 PM - 01:30 PM",
      registeredAt: "2026-11-09T08:00:00.000Z"
    },
    {
      id: "REG-2002",
      studentId: "STU-1002",
      studentName: "Fathima Nihala",
      studentClass: "12-Commerce A",
      sessionId: "sess-4",
      sessionTitle: "Beyond Savings",
      venue: "Incubator",
      timeSlot: "02:30 PM - 04:00 PM",
      registeredAt: "2026-11-09T08:05:00.000Z"
    },
    {
      id: "REG-2003",
      studentId: "STU-1003",
      studentName: "Mohammed Shamil",
      studentClass: "12-Commerce A",
      sessionId: "sess-3",
      sessionTitle: "Elevate Your Skills",
      venue: "Majlis",
      timeSlot: "02:30 PM - 04:00 PM",
      registeredAt: "2026-11-09T08:10:00.000Z"
    }
  ]
};

function readDb() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2), 'utf-8');
      return defaultData;
    }
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading DB:", err);
    return defaultData;
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error("Error writing DB:", err);
    return false;
  }
}

module.exports = {
  readDb,
  writeDb,
  defaultData
};
