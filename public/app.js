/**
 * CONFLUENCE - Caliph Commerce Domain Conclave Registration Portal
 * Client Application Logic (Tick Checkbox Workflow)
 */

// Global State
const state = {
  sessions: [],
  students: [],
  registrations: [],
  activeStudent: null,
  selectedSessionIds: new Set(),
  activeFilter: 'all',
  clashMode: 'disappear', // 'disappear' (default) or 'cut'
  currentAdminTab: 'summary',
  stats: null
};

// DOM Elements
const elements = {
  // Navigation
  navRegBtn: document.getElementById('nav-registration-btn'),
  navAdminBtn: document.getElementById('nav-admin-btn'),
  viewReg: document.getElementById('view-registration'),
  viewAdmin: document.getElementById('view-admin'),

  // Hero Stats
  statHeroSessions: document.getElementById('stat-hero-sessions'),
  statHeroStudents: document.getElementById('stat-hero-students'),

  // Student Search & Active Student Bar
  studentSearchInput: document.getElementById('student-search-input'),
  studentSearchDropdown: document.getElementById('student-search-dropdown'),
  btnClearSearch: document.getElementById('btn-clear-search'),
  quickStudentChips: document.getElementById('quick-student-chips'),
  activeStudentPill: document.getElementById('active-student-pill'),
  activeStudentAvatar: document.getElementById('active-student-avatar'),
  activeStudentName: document.getElementById('active-student-name'),
  activeStudentClass: document.getElementById('active-student-class'),
  activeStudentMeta: document.getElementById('active-student-meta'),
  btnClearStudent: document.getElementById('btn-clear-student'),
  studentEnrolledSummary: document.getElementById('student-enrolled-summary'),
  studentRegCount: document.getElementById('student-reg-count'),
  studentRegList: document.getElementById('student-reg-list'),

  // Step 2 & Checkbox Table Elements
  step2Container: document.getElementById('step2-container'),
  noStudentPlaceholder: document.getElementById('no-student-placeholder'),
  sessionsTableWrapper: document.getElementById('sessions-table-wrapper'),
  sessionsChecklistTbody: document.getElementById('sessions-checklist-tbody'),
  sessionsMobileCards: document.getElementById('sessions-mobile-cards'),
  selectedSessionsCount: document.getElementById('selected-sessions-count'),
  barStudentName: document.getElementById('bar-student-name'),
  btnUncheckAll: document.getElementById('btn-uncheck-all'),
  btnBatchRegister: document.getElementById('btn-batch-register'),
  btnRegisterLabel: document.getElementById('btn-register-label'),
  filterButtons: document.querySelectorAll('.filter-btn'),
  btnModeDisappear: document.getElementById('btn-mode-disappear'),
  btnModeCut: document.getElementById('btn-mode-cut'),

  // Admin Elements
  adminSummaryList: document.getElementById('admin-summary-list'),
  adminSessionsTable: document.getElementById('admin-sessions-table'),
  adminStudentsTable: document.getElementById('admin-students-table'),
  adminStudentCount: document.getElementById('admin-student-count'),
  adminStudentSearch: document.getElementById('admin-student-search'),
  kpiSessions: document.getElementById('kpi-sessions'),
  kpiRegistrations: document.getElementById('kpi-registrations'),
  kpiCapacity: document.getElementById('kpi-capacity'),
  kpiFull: document.getElementById('kpi-full'),

  // Modals
  modalPass: document.getElementById('modal-pass'),
  modalSessionForm: document.getElementById('modal-session-form'),
  modalAdminLock: document.getElementById('modal-admin-lock'),
  formAdminLock: document.getElementById('form-admin-lock'),
  adminPinInput: document.getElementById('admin-pin-input'),
  adminPinError: document.getElementById('admin-pin-error'),
  btnCloseAdminLock: document.getElementById('btn-close-admin-lock'),
  btnCancelAdminLock: document.getElementById('btn-cancel-admin-lock'),
  btnLockAdmin: document.getElementById('btn-lock-admin'),

  // Pass Modal Details
  passIdBadge: document.getElementById('pass-id-badge'),
  passStudentName: document.getElementById('pass-student-name'),
  passStudentClass: document.getElementById('pass-student-class'),
  passSessionsList: document.getElementById('pass-sessions-list'),
  passQrcode: document.getElementById('pass-qrcode'),
  btnPrintPass: document.getElementById('btn-print-pass'),
  btnClosePass: document.getElementById('btn-close-pass'),

  // Forms
  formSession: document.getElementById('form-session'),
  formAddStudent: document.getElementById('form-add-student'),
  excelDropzone: document.getElementById('excel-dropzone'),
  excelFileInput: document.getElementById('excel-file-input'),
  uploadStatus: document.getElementById('upload-status'),
  btnCreateSessionModal: document.getElementById('btn-create-session-modal'),
  btnCloseSessionModal: document.getElementById('btn-close-session-modal'),
  btnCancelSessionModal: document.getElementById('btn-cancel-session-modal'),

  // Toasts
  toastContainer: document.getElementById('toast-container')
};

// -------------------------------------------------------------
// TOAST NOTIFICATION SYSTEM
// -------------------------------------------------------------
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-2xl border text-xs sm:text-sm font-medium transition-all transform duration-300 translate-y-2 opacity-0 ${
    type === 'error' 
      ? 'bg-rose-950/95 border-rose-500/50 text-rose-200' 
      : type === 'warning'
      ? 'bg-amber-950/95 border-amber-500/50 text-amber-200'
      : type === 'success'
      ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200'
      : 'bg-slate-900/95 border-brand-500/50 text-slate-100'
  }`;

  const iconName = type === 'error' ? 'alert-triangle' : type === 'warning' ? 'alert-circle' : type === 'success' ? 'check-circle' : 'info';
  
  toast.innerHTML = `
    <div class="mt-0.5">
      <i data-lucide="${iconName}" class="w-4 h-4 shrink-0"></i>
    </div>
    <div class="flex-1">${message}</div>
    <button class="text-current opacity-70 hover:opacity-100 p-0.5" onclick="this.parentElement.remove()">
      <i data-lucide="x" class="w-3.5 h-3.5"></i>
    </button>
  `;

  elements.toastContainer.appendChild(toast);
  lucide.createIcons({ root: toast });

  setTimeout(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  }, 10);

  setTimeout(() => {
    toast.classList.add('opacity-0', '-translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}

// -------------------------------------------------------------
// DATA FETCHING
// -------------------------------------------------------------
async function fetchSessions() {
  try {
    const res = await fetch('/api/sessions');
    state.sessions = await res.json();
    renderSessionsChecklist();
    renderAdminSummary();
    renderAdminSessionsTable();
    updateStats();
  } catch (err) {
    console.error("Error fetching sessions:", err);
    showToast("Failed to load sessions from server.", "error");
  }
}

async function fetchStudents() {
  try {
    const res = await fetch('/api/students');
    state.students = await res.json();
    renderAdminStudentsTable();
    renderQuickStudentChips();
    elements.adminStudentCount.textContent = state.students.length;
    elements.statHeroStudents.textContent = state.students.length;
  } catch (err) {
    console.error("Error fetching students:", err);
  }
}

async function fetchRegistrations() {
  try {
    const res = await fetch('/api/registrations');
    state.registrations = await res.json();
    if (state.activeStudent) {
      updateActiveStudentRegistrations();
    }
  } catch (err) {
    console.error("Error fetching registrations:", err);
  }
}

async function updateStats() {
  try {
    const res = await fetch('/api/stats');
    state.stats = await res.json();
    
    // Update KPIs
    elements.kpiSessions.textContent = state.stats.totalSessions;
    elements.kpiRegistrations.textContent = state.stats.totalRegistrations;
    elements.kpiCapacity.textContent = state.stats.totalSeats;
    elements.kpiFull.textContent = state.stats.fullSessionsCount;

    elements.statHeroSessions.textContent = state.stats.totalSessions;
    elements.statHeroStudents.textContent = state.stats.totalStudents;
  } catch (err) {
    console.error("Error fetching stats:", err);
  }
}

// -------------------------------------------------------------
// STUDENT SELECTION & SEARCH WORKFLOW
// -------------------------------------------------------------
function renderQuickStudentChips() {
  const container = elements.quickStudentChips;
  if (!container) return;

  if (state.students.length === 0) {
    container.innerHTML = `
      <span class="text-slate-400 text-xs italic flex items-center gap-1.5 py-1">
        <i data-lucide="info" class="w-3.5 h-3.5 text-amber-400"></i>
        <span>No students uploaded yet. <a href="javascript:void(0)" onclick="elements.navAdminBtn.click()" class="text-brand-400 font-bold underline hover:text-brand-300">Open Admin Panel</a> to upload your Student Excel file or add students.</span>
      </span>
    `;
    lucide.createIcons({ root: container });
    return;
  }

  container.innerHTML = '<span class="text-slate-500 text-[11px] font-medium">Quick Select:</span>';
  const sampleList = state.students.slice(0, 6);

  sampleList.forEach(st => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-brand-600 text-slate-300 hover:text-white border border-slate-700/80 transition text-[11px] font-semibold';
    chip.textContent = `${st.name} (${st.className})`;
    chip.addEventListener('click', () => selectStudent(st));
    container.appendChild(chip);
  });
  lucide.createIcons({ root: container });
}

let searchDebounceTimeout = null;

elements.studentSearchInput.addEventListener('input', (e) => {
  const query = e.target.value.trim();
  
  if (query.length > 0) {
    elements.btnClearSearch.classList.remove('hidden');
  } else {
    elements.btnClearSearch.classList.add('hidden');
    elements.studentSearchDropdown.classList.add('hidden');
    return;
  }

  clearTimeout(searchDebounceTimeout);
  searchDebounceTimeout = setTimeout(() => {
    performStudentSearch(query);
  }, 120);
});

elements.btnClearSearch.addEventListener('click', () => {
  elements.studentSearchInput.value = '';
  elements.btnClearSearch.classList.add('hidden');
  elements.studentSearchDropdown.classList.add('hidden');
  elements.studentSearchInput.focus();
});

function performStudentSearch(query) {
  const q = query.toLowerCase();
  const matches = state.students.filter(s => 
    (s.name && s.name.toLowerCase().includes(q)) ||
    (s.className && s.className.toLowerCase().includes(q)) ||
    (s.id && s.id.toLowerCase().includes(q)) ||
    (s.rollNo && s.rollNo.toString().toLowerCase().includes(q))
  ).slice(0, 8);

  const dropdown = elements.studentSearchDropdown;
  dropdown.innerHTML = '';

  if (matches.length === 0) {
    dropdown.innerHTML = `
      <div class="p-4 text-center text-xs text-slate-400">
        No students found matching "<span class="text-white">${query}</span>".
        <div class="mt-1 text-[11px] text-brand-400">Tip: Upload the student roster via Excel in Admin Panel or add the student manually.</div>
      </div>
    `;
    dropdown.classList.remove('hidden');
    return;
  }

  matches.forEach(student => {
    const item = document.createElement('div');
    item.className = 'p-3 hover:bg-slate-800/90 cursor-pointer flex items-center justify-between transition';
    item.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-brand-600/20 border border-brand-500/30 text-brand-400 flex items-center justify-center font-bold text-xs uppercase">
          ${student.name.charAt(0)}
        </div>
        <div>
          <div class="text-xs font-bold text-white">${student.name}</div>
          <div class="text-[11px] text-slate-400">Class: <span class="text-brand-300 font-bold">${student.className}</span> ${student.rollNo ? `• Roll No: ${student.rollNo}` : ''}</div>
        </div>
      </div>
      <button class="text-xs font-bold text-brand-400 hover:text-white bg-brand-500/10 hover:bg-brand-500 px-3 py-1.5 rounded-lg border border-brand-500/20 transition flex items-center gap-1">
        <span>Select Student</span>
        <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
      </button>
    `;
    item.addEventListener('click', () => {
      selectStudent(student);
    });
    dropdown.appendChild(item);
  });

  dropdown.classList.remove('hidden');
  lucide.createIcons({ root: dropdown });
}

// Close dropdown on outside click
document.addEventListener('click', (e) => {
  if (!elements.studentSearchInput.contains(e.target) && !elements.studentSearchDropdown.contains(e.target)) {
    elements.studentSearchDropdown.classList.add('hidden');
  }
});

function selectStudent(student) {
  state.activeStudent = student;
  state.selectedSessionIds.clear(); // Reset ticked sessions for new student

  elements.studentSearchDropdown.classList.add('hidden');
  elements.studentSearchInput.value = '';
  elements.btnClearSearch.classList.add('hidden');

  // Activate student banner
  elements.activeStudentPill.classList.remove('hidden');
  elements.activeStudentAvatar.textContent = student.name.charAt(0).toUpperCase();
  elements.activeStudentName.textContent = student.name;
  elements.activeStudentClass.textContent = student.className;
  elements.activeStudentMeta.textContent = student.rollNo ? `Roll No: ${student.rollNo}` : `Class Batch: ${student.className}`;
  elements.barStudentName.textContent = student.name;

  // Reveal Step 2 Checklist Table & Hide Placeholder
  elements.noStudentPlaceholder.classList.add('hidden');
  elements.sessionsTableWrapper.classList.remove('hidden');

  // Update existing registrations for this student
  updateActiveStudentRegistrations();

  // Render the session table with tick checkboxes
  renderSessionsChecklist();

  showToast(`✓ Selected student: ${student.name} (${student.className}). Now tick the sessions below!`, "success");

  // Smooth scroll to the checklist
  elements.sessionsTableWrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

elements.btnClearStudent.addEventListener('click', () => {
  state.activeStudent = null;
  state.selectedSessionIds.clear();

  elements.activeStudentPill.classList.add('hidden');
  elements.studentEnrolledSummary.classList.add('hidden');

  // Hide Checklist Table & Show Placeholder
  elements.sessionsTableWrapper.classList.add('hidden');
  elements.noStudentPlaceholder.classList.remove('hidden');

  showToast("Student selection cleared. Search another student to register.", "info");
});

function updateActiveStudentRegistrations() {
  if (!state.activeStudent) return;

  const enrolled = state.registrations.filter(r => r.studentId === state.activeStudent.id);
  elements.studentRegCount.textContent = `${enrolled.length} session(s)`;

  const list = elements.studentRegList;
  list.innerHTML = '';

  if (enrolled.length === 0) {
    list.innerHTML = `<span class="text-slate-500 italic text-[11px]">No sessions registered yet. Tick the programs below to register.</span>`;
  } else {
    enrolled.forEach(reg => {
      const badge = document.createElement('div');
      badge.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs shadow-sm';
      badge.innerHTML = `
        <i data-lucide="check" class="w-3.5 h-3.5 text-emerald-400"></i>
        <span class="font-bold">${reg.sessionTitle}</span>
        <span class="text-[10px] text-emerald-400 font-mono">(${reg.venue} • ${reg.timeSlot})</span>
        <button onclick="cancelRegistration('${reg.id}')" title="Cancel this registration" class="text-emerald-400 hover:text-rose-400 ml-1.5 p-0.5 rounded hover:bg-emerald-900/40 transition">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
        </button>
      `;
      list.appendChild(badge);
    });
  }

  elements.studentEnrolledSummary.classList.remove('hidden');
  lucide.createIcons({ root: elements.studentEnrolledSummary });
}

// -------------------------------------------------------------
// SESSIONS REGISTRATION CHECKLIST (TICK COLUMN WORKFLOW)
// -------------------------------------------------------------
function renderSessionsChecklist() {
  const tbody = elements.sessionsChecklistTbody;
  const mobileContainer = elements.sessionsMobileCards;
  if (tbody) tbody.innerHTML = '';
  if (mobileContainer) mobileContainer.innerHTML = '';

  if (!state.activeStudent) {
    return;
  }

  if (state.sessions.length === 0) {
    const emptyMsg = `
      <div class="py-10 px-4 text-center">
        <div class="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto mb-3">
          <i data-lucide="calendar-x" class="w-6 h-6"></i>
        </div>
        <div class="text-sm font-bold text-white mb-1">No Sessions Created Yet</div>
        <p class="text-xs text-slate-400 max-w-sm mx-auto mb-3">
          No conclave sessions are currently in the system. Use the Admin Panel to create sessions.
        </p>
        <button type="button" onclick="elements.navAdminBtn.click()" class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition">
          <i data-lucide="plus" class="w-3.5 h-3.5"></i>
          <span>Add Session in Admin Panel</span>
        </button>
      </div>
    `;
    if (tbody) tbody.innerHTML = `<tr><td colspan="6">${emptyMsg}</td></tr>`;
    if (mobileContainer) mobileContainer.innerHTML = emptyMsg;
    if (tbody) lucide.createIcons({ root: tbody });
    if (mobileContainer) lucide.createIcons({ root: mobileContainer });
    updateSelectedCountUI();
    return;
  }

  let filtered = state.sessions;
  if (state.activeFilter === 'Majlis') {
    filtered = filtered.filter(s => s.venue.toLowerCase().includes('majlis') || (s.category && s.category.toLowerCase().includes('majlis')));
  } else if (state.activeFilter === 'Incubator') {
    filtered = filtered.filter(s => s.venue.toLowerCase().includes('incubator') || (s.category && s.category.toLowerCase().includes('incubator')));
  }

  if (filtered.length === 0) {
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-slate-400 text-xs">No sessions match the selected filter.</td></tr>`;
    }
    if (mobileContainer) {
      mobileContainer.innerHTML = `<div class="text-center py-8 text-slate-400 text-xs bg-slate-900/60 rounded-xl p-4">No sessions match the selected filter.</div>`;
    }
    updateSelectedCountUI();
    return;
  }

  // Get active student's currently registered session IDs
  const enrolledSessionIds = state.registrations
    .filter(r => r.studentId === state.activeStudent.id)
    .map(r => r.sessionId);

  // Track all occupied time slots (from enrolled sessions and currently ticked sessions)
  const occupiedTimeSlots = {};
  enrolledSessionIds.forEach(id => {
    const s = state.sessions.find(x => x.id === id);
    if (s && s.timeSlot && s.timeSlot !== 'TBD') {
      occupiedTimeSlots[s.timeSlot] = { session: s, reason: 'Enrolled' };
    }
  });
  state.selectedSessionIds.forEach(id => {
    const s = state.sessions.find(x => x.id === id);
    if (s && s.timeSlot && s.timeSlot !== 'TBD') {
      occupiedTimeSlots[s.timeSlot] = { session: s, reason: 'Selected' };
    }
  });

  // Venue badge styles
  const venueColors = {
    'Majlis': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    'Incubator': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    'Main Auditorium': 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    'Activity Arena': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    'Open Stage': 'bg-rose-500/15 text-rose-400 border-rose-500/30'
  };

  filtered.forEach(session => {
    const isEnrolled = enrolledSessionIds.includes(session.id);
    const isFull = session.isFull;
    const isTicked = state.selectedSessionIds.has(session.id);

    // Check if another event at the SAME time slot is already chosen
    const occupier = occupiedTimeSlots[session.timeSlot];
    const isClashed = occupier && occupier.session.id !== session.id;

    // RULE: If registrar chooses one event, other event at the same time slot will disappear!
    if (isClashed && state.clashMode === 'disappear') {
      return; // Disappears completely from both table and mobile cards!
    }

    const progressWidth = `${session.percentFilled}%`;
    const progressColor = isFull ? 'bg-rose-500' : session.percentFilled > 80 ? 'bg-amber-500' : 'bg-brand-500';

    // 1. DESKTOP TABLE ROW
    if (tbody) {
      const tr = document.createElement('tr');
      tr.className = `transition-colors duration-150 ${
        isClashed
          ? 'opacity-40 bg-rose-950/20 cursor-not-allowed border-l-2 border-l-rose-500/50'
          : isEnrolled 
          ? 'bg-emerald-950/20' 
          : isTicked 
          ? 'bg-brand-950/40 border-l-4 border-l-brand-500' 
          : isFull 
          ? 'opacity-60 bg-slate-950/30' 
          : 'hover:bg-slate-900/50'
      }`;

      let tickHtml = '';
      if (isClashed) {
        tickHtml = `
          <div class="flex flex-col items-center justify-center cursor-not-allowed" title="Cut out: Clashed with ${occupier.session.title}">
            <span class="px-2 py-0.5 rounded bg-rose-950/90 text-rose-300 border border-rose-500/50 flex items-center gap-1 text-[10px] font-bold">
              <i data-lucide="scissors" class="w-3 h-3 text-rose-400"></i>
              <span>CUT</span>
            </span>
            <span class="text-[9px] text-rose-400 font-semibold mt-0.5">Clashed</span>
          </div>
        `;
      } else if (isEnrolled) {
        tickHtml = `
          <div class="flex flex-col items-center justify-center">
            <span class="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-xs font-bold" title="Already Registered">
              <i data-lucide="check" class="w-4 h-4"></i>
            </span>
            <span class="text-[9px] text-emerald-400 font-bold mt-0.5 uppercase tracking-tighter">Enrolled</span>
          </div>
        `;
      } else if (isFull) {
        tickHtml = `
          <div class="flex flex-col items-center justify-center cursor-not-allowed" onclick="showToast('⚠️ Quota Reached: This session is fully booked!', 'error')" title="Quota Full">
            <span class="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center text-xs">
              <i data-lucide="lock" class="w-3.5 h-3.5"></i>
            </span>
            <span class="text-[9px] text-rose-400 font-bold mt-0.5 uppercase tracking-tighter">Full</span>
          </div>
        `;
      } else {
        tickHtml = `
          <div class="flex items-center justify-center">
            <label class="relative flex items-center justify-center cursor-pointer p-1">
              <input 
                type="checkbox" 
                class="session-checkbox w-5 h-5 rounded-md border-2 border-slate-600 bg-slate-900 text-brand-600 focus:ring-brand-500 focus:ring-offset-0 transition cursor-pointer checked:border-brand-500 checked:bg-brand-600"
                data-session-id="${session.id}"
                ${isTicked ? 'checked' : ''}
              />
            </label>
          </div>
        `;
      }

      tr.innerHTML = `
        <td class="py-3 px-3 text-center align-middle">
          ${tickHtml}
        </td>
        <td class="py-3 px-4 align-middle">
          <div class="font-bold text-sm sm:text-base ${isClashed ? 'text-slate-500 line-through decoration-rose-500 decoration-2' : 'text-white'}">
            ${session.title}
          </div>
          ${isClashed ? `
            <div class="text-[11px] text-rose-400 font-medium mt-0.5 flex items-center gap-1">
              <i data-lucide="alert-triangle" class="w-3 h-3"></i>
              <span>Cut out: Clashed with chosen "${occupier.session.title}" (${session.timeSlot})</span>
            </div>
          ` : (session.subtitle ? `<div class="text-[11px] text-slate-400 leading-snug mt-0.5">${session.subtitle}</div>` : '')}
        </td>
        <td class="py-3 px-4 align-middle">
          <span class="px-2.5 py-1 rounded-md text-[11px] font-semibold border ${venueColors[session.venue] || 'bg-slate-800 text-slate-300 border-slate-700'}">
            ${session.venue}
          </span>
        </td>
        <td class="py-3 px-4 align-middle font-mono font-bold text-brand-400 text-xs">
          <div class="flex items-center gap-1.5">
            <i data-lucide="clock" class="w-3.5 h-3.5"></i>
            <span>${session.timeSlot}</span>
          </div>
        </td>
        <td class="py-3 px-4 align-middle">
          <div class="text-xs font-bold text-slate-200">${session.speaker || 'TBD'}</div>
          <div class="text-[10px] text-slate-400">${session.speakerRole || ''}</div>
        </td>
        <td class="py-3 px-4 align-middle text-center min-w-[140px]">
          <div class="text-xs font-mono font-semibold ${isFull ? 'text-rose-400' : 'text-slate-300'}">
            <strong>${session.registeredCount}</strong> / ${session.quota} filled
          </div>
          <div class="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800 mt-1">
            <div class="${progressColor} h-full rounded-full transition-all" style="width: ${progressWidth}"></div>
          </div>
          <div class="text-[10px] mt-0.5 ${isFull ? 'text-rose-400 font-bold' : 'text-emerald-400'}">
            ${isFull ? 'Quota Full' : `${session.remainingQuota} seats left`}
          </div>
        </td>
      `;

      if (!isEnrolled && !isFull && !isClashed) {
        tr.classList.add('cursor-pointer');
        tr.addEventListener('click', (e) => {
          if (e.target.tagName !== 'INPUT') {
            const checkbox = tr.querySelector('.session-checkbox');
            if (checkbox) {
              checkbox.checked = !checkbox.checked;
              handleToggleSession(session.id, checkbox.checked);
            }
          }
        });
      } else if (isClashed) {
        tr.addEventListener('click', () => {
          showToast(`✂️ This event is cut because you selected "${occupier.session.title}" at ${session.timeSlot}. Untick that one first to switch.`, "warning");
        });
      }

      tbody.appendChild(tr);
    }

    // 2. MOBILE PHONE KILLER INTERACTIVE CARD
    if (mobileContainer) {
      const card = document.createElement('div');
      card.className = `p-4 rounded-2xl border transition-all duration-200 select-none ${
        isClashed
          ? 'opacity-40 bg-rose-950/20 border-rose-500/40'
          : isEnrolled
          ? 'bg-emerald-950/25 border-emerald-500/40'
          : isTicked
          ? 'bg-gradient-to-br from-brand-950/60 to-slate-900 border-brand-500 ring-2 ring-brand-500/30 shadow-lg shadow-brand-600/15'
          : isFull
          ? 'opacity-60 bg-slate-950/40 border-slate-800'
          : 'bg-slate-900/90 border-cardBorder hover:border-slate-700 active:scale-[0.98]'
      }`;

      let mobileIndicatorHtml = '';
      if (isClashed) {
        mobileIndicatorHtml = `
          <span class="px-2 py-0.5 rounded-lg bg-rose-950/90 text-rose-300 border border-rose-500/50 flex items-center gap-1 text-[11px] font-bold">
            <i data-lucide="scissors" class="w-3 h-3 text-rose-400"></i>
            <span>CUT</span>
          </span>
        `;
      } else if (isEnrolled) {
        mobileIndicatorHtml = `
          <span class="px-2.5 py-0.5 rounded-lg bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 flex items-center gap-1 text-[11px] font-bold">
            <i data-lucide="check" class="w-3.5 h-3.5 text-emerald-400"></i>
            <span>ENROLLED</span>
          </span>
        `;
      } else if (isFull) {
        mobileIndicatorHtml = `
          <span class="px-2.5 py-0.5 rounded-lg bg-rose-950/90 text-rose-300 border border-rose-500/50 flex items-center gap-1 text-[11px] font-bold">
            <i data-lucide="lock" class="w-3.5 h-3.5 text-rose-400"></i>
            <span>FULL</span>
          </span>
        `;
      } else {
        mobileIndicatorHtml = `
          <div class="w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
            isTicked 
              ? 'bg-gradient-to-tr from-brand-600 to-amber-500 text-white shadow-md shadow-brand-500/40 ring-2 ring-brand-400' 
              : 'bg-slate-800 border-2 border-slate-600 text-transparent'
          }">
            <i data-lucide="check" class="w-4 h-4"></i>
          </div>
        `;
      }

      card.innerHTML = `
        <div class="flex items-start justify-between gap-2.5">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="px-2 py-0.5 rounded-md text-[10px] font-bold border ${venueColors[session.venue] || 'bg-slate-800 text-slate-300 border-slate-700'}">
              ${session.venue}
            </span>
            <span class="text-[11px] font-mono font-bold text-brand-400 flex items-center gap-1 bg-slate-950/80 px-2 py-0.5 rounded-md border border-slate-800">
              <i data-lucide="clock" class="w-3 h-3 text-amber-400"></i>
              <span>${session.timeSlot}</span>
            </span>
          </div>
          <div class="flex-shrink-0">
            ${mobileIndicatorHtml}
          </div>
        </div>

        <div class="mt-2.5">
          <h4 class="text-sm font-extrabold ${isClashed ? 'text-slate-500 line-through decoration-rose-500 decoration-2' : 'text-white'} leading-snug">
            ${session.title}
          </h4>
          ${isClashed ? `
            <div class="text-[11px] text-rose-400 font-medium mt-1 flex items-center gap-1">
              <i data-lucide="alert-triangle" class="w-3 h-3"></i>
              <span>Cut out: Clashed with chosen "${occupier.session.title}" (${session.timeSlot})</span>
            </div>
          ` : (session.subtitle ? `<p class="text-[11px] text-slate-400 mt-1 leading-snug">${session.subtitle}</p>` : '')}
        </div>

        <div class="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
          <div class="flex items-center gap-2 min-w-0">
            <div class="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-amber-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
              ${(session.speaker || 'S').charAt(0)}
            </div>
            <div class="truncate">
              <div class="font-bold text-slate-200 text-xs truncate">${session.speaker || 'TBD'}</div>
              <div class="text-[10px] text-slate-500 truncate">${session.speakerRole || ''}</div>
            </div>
          </div>
          <div class="text-right flex-shrink-0">
            <span class="text-[10px] font-mono font-bold ${isFull ? 'text-rose-400' : 'text-emerald-400'}">
              ${isFull ? 'FULL' : `${session.remainingQuota} seats left`}
            </span>
            <div class="w-16 bg-slate-950 rounded-full h-1 overflow-hidden border border-slate-800 mt-0.5">
              <div class="${progressColor} h-full rounded-full" style="width: ${progressWidth}"></div>
            </div>
          </div>
        </div>
      `;

      if (!isEnrolled && !isFull && !isClashed) {
        card.classList.add('cursor-pointer');
        card.addEventListener('click', () => {
          const willBeChecked = !state.selectedSessionIds.has(session.id);
          handleToggleSession(session.id, willBeChecked);
        });
      } else if (isClashed) {
        card.addEventListener('click', () => {
          showToast(`✂️ This event is cut because you selected "${occupier.session.title}" at ${session.timeSlot}. Untick that one first to switch.`, "warning");
        });
      }

      mobileContainer.appendChild(card);
    }
  });

  // Attach change listeners to checkboxes in table
  if (tbody) {
    tbody.querySelectorAll('.session-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const sId = e.target.getAttribute('data-session-id');
        handleToggleSession(sId, e.target.checked);
      });
    });
    lucide.createIcons({ root: tbody });
  }

  if (mobileContainer) {
    lucide.createIcons({ root: mobileContainer });
  }

  updateSelectedCountUI();
}

function handleToggleSession(sessionId, isChecked) {
  const session = state.sessions.find(s => s.id === sessionId);
  if (!session) return;

  if (isChecked) {
    state.selectedSessionIds.add(sessionId);
    showToast(`✓ Selected "${session.title}" (${session.timeSlot})`, "info");
  } else {
    state.selectedSessionIds.delete(sessionId);
    showToast(`Unselected "${session.title}". Competing sessions restored.`, "info");
  }

  renderSessionsChecklist();
}

function updateSelectedCountUI() {
  const count = state.selectedSessionIds.size;
  if (elements.selectedSessionsCount) {
    elements.selectedSessionsCount.textContent = count;
  }
  const statusText = document.getElementById('bar-status-text');
  if (statusText) {
    if (count > 0) {
      statusText.textContent = `${count} session${count > 1 ? 's' : ''} ticked • Ready`;
      statusText.className = 'text-xs font-bold text-emerald-400';
    } else {
      statusText.textContent = 'Tick sessions above';
      statusText.className = 'text-xs font-bold text-slate-400';
    }
  }
  const btn = elements.btnBatchRegister;
  if (btn && !btn.disabled) {
    const label = count > 0 
      ? `REGISTER (${count})`
      : 'REGISTER SESSIONS';
    btn.innerHTML = `<i data-lucide="ticket" class="w-4 h-4"></i><span id="btn-register-label">${label}</span>`;
    lucide.createIcons({ root: btn });
  }
}

function setRegisterButtonLoading(isLoading) {
  const btn = elements.btnBatchRegister;
  if (!btn) return;
  btn.disabled = isLoading;
  if (isLoading) {
    btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Processing...</span>`;
    lucide.createIcons({ root: btn });
  } else {
    updateSelectedCountUI();
  }
}

elements.btnUncheckAll.addEventListener('click', () => {
  state.selectedSessionIds.clear();
  renderSessionsChecklist();
  showToast("All ticks cleared.", "info");
});

// -------------------------------------------------------------
// BATCH REGISTRATION SUBMISSION (FINAL REGISTER CLICK)
// -------------------------------------------------------------
elements.btnBatchRegister.addEventListener('click', async () => {
  if (!state.activeStudent) {
    showToast("⚠️ Please select a student profile in Step 1 first!", "warning");
    elements.studentSearchInput.focus();
    return;
  }

  if (state.selectedSessionIds.size === 0) {
    showToast("⚠️ Please tick at least one session from the checklist table to register!", "warning");
    return;
  }

  const sessionIdsToRegister = Array.from(state.selectedSessionIds);
  const student = state.activeStudent;

  try {
    setRegisterButtonLoading(true);

    const res = await fetch('/api/registrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: student.id,
        sessionIds: sessionIdsToRegister
      })
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || "Failed to register.", "error");
      setRegisterButtonLoading(false);
      return;
    }

    // Success Confetti (guarded safely)
    if (typeof confetti === 'function') {
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (e) {
        console.warn("Confetti effect failed:", e);
      }
    }

    showToast(data.message, "success");

    // Clear ticked sessions
    state.selectedSessionIds.clear();

    // Show Registration Ticket Pass
    showMultiPassModal(data.registrations || [data.registration], student);

    // Refresh database state
    await fetchSessions();
    await fetchRegistrations();
    updateStats();

  } catch (err) {
    console.error("Batch registration error:", err);
    showToast("Network error while completing registration.", "error");
  } finally {
    setRegisterButtonLoading(false);
  }
});

// -------------------------------------------------------------
// REGISTRATION TICKET PASS MODAL
// -------------------------------------------------------------
function showMultiPassModal(registrations, student) {
  elements.passIdBadge.textContent = registrations.length === 1 ? registrations[0].id : `PASS: ${registrations.length} SESSIONS`;
  elements.passStudentName.textContent = student.name;
  elements.passStudentClass.textContent = student.rollNo ? `Class: ${student.className} • Roll No: ${student.rollNo}` : `Class: ${student.className}`;

  const listContainer = elements.passSessionsList;
  listContainer.innerHTML = '';

  registrations.forEach(reg => {
    const item = document.createElement('div');
    item.className = 'p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs';
    item.innerHTML = `
      <div>
        <div class="font-bold text-white">${reg.sessionTitle}</div>
        <div class="text-[10px] text-amber-400 font-medium">${reg.venue} • <span class="font-mono text-slate-300">${reg.timeSlot}</span></div>
      </div>
      <div class="text-right">
        <span class="text-[10px] px-2 py-0.5 rounded bg-brand-950 border border-brand-500/40 text-brand-300 font-mono font-bold">${reg.id}</span>
      </div>
    `;
    listContainer.appendChild(item);
  });

  // Show modal first
  elements.modalPass.classList.remove('hidden');
  elements.modalPass.classList.add('flex');

  // Generate QR Code with all Pass details safely
  try {
    elements.passQrcode.innerHTML = '';
    const qrString = `CONFLUENCE-2026|STU:${student.id}|NAME:${student.name}|PASSES:${registrations.map(r => r.id).join(',')}`;
    if (typeof QRCode !== 'undefined') {
      new QRCode(elements.passQrcode, {
        text: qrString,
        width: 104,
        height: 104,
        colorDark: "#090D16",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M
      });
    } else {
      elements.passQrcode.innerHTML = `<div class="text-[10px] text-slate-700 font-mono text-center p-2 font-bold">VERIFIED PASS<br>${registrations[0]?.id || ''}</div>`;
    }
  } catch (qrErr) {
    console.warn("QR code render notice:", qrErr);
    elements.passQrcode.innerHTML = `<div class="text-[10px] text-slate-700 font-mono text-center p-2 font-bold">VERIFIED PASS<br>${registrations[0]?.id || ''}</div>`;
  }
}

elements.btnClosePass.addEventListener('click', () => {
  elements.modalPass.classList.add('hidden');
  elements.modalPass.classList.remove('flex');
});

elements.btnPrintPass.addEventListener('click', () => {
  window.print();
});

window.cancelRegistration = async function(regId) {
  if (!confirm("Are you sure you want to cancel this session registration? This will free up the seat.")) {
    return;
  }

  try {
    const res = await fetch(`/api/registrations/${regId}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) {
      showToast(data.message, "info");
      await fetchSessions();
      await fetchRegistrations();
      updateStats();
    } else {
      showToast(data.error || "Failed to cancel registration.", "error");
    }
  } catch (err) {
    console.error("Cancel registration error:", err);
  }
};

// -------------------------------------------------------------
// ADMIN PANEL LOGIC & EXCEL UPLOADS
// -------------------------------------------------------------
const adminTabs = {
  summary: document.getElementById('admin-tab-summary'),
  sessions: document.getElementById('admin-tab-sessions'),
  students: document.getElementById('admin-tab-students')
};

document.getElementById('admin-tab-btn-summary').addEventListener('click', () => switchAdminTab('summary'));
document.getElementById('admin-tab-btn-sessions').addEventListener('click', () => switchAdminTab('sessions'));
document.getElementById('admin-tab-btn-students').addEventListener('click', () => switchAdminTab('students'));

function switchAdminTab(tabKey) {
  state.currentAdminTab = tabKey;
  
  document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.classList.remove('border-brand-500', 'text-brand-400');
    btn.classList.add('border-transparent', 'text-slate-400');
  });

  const activeBtn = document.getElementById(`admin-tab-btn-${tabKey}`);
  if (activeBtn) {
    activeBtn.classList.add('border-brand-500', 'text-brand-400');
    activeBtn.classList.remove('border-transparent', 'text-slate-400');
  }

  Object.keys(adminTabs).forEach(key => {
    if (key === tabKey) {
      adminTabs[key].classList.remove('hidden');
    } else {
      adminTabs[key].classList.add('hidden');
    }
  });

  if (tabKey === 'summary') renderAdminSummary();
  if (tabKey === 'sessions') renderAdminSessionsTable();
  if (tabKey === 'students') renderAdminStudentsTable();
}

function renderAdminSummary() {
  const container = elements.adminSummaryList;
  container.innerHTML = '';

  if (state.sessions.length === 0) {
    container.innerHTML = `<div class="text-xs text-slate-500 py-6 text-center">No sessions available.</div>`;
    return;
  }

  state.sessions.forEach(sess => {
    const sessRegs = state.registrations.filter(r => r.sessionId === sess.id);
    const item = document.createElement('div');
    item.className = 'p-4 rounded-xl bg-slate-900/60 border border-cardBorder space-y-3';

    item.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-mono font-bold text-brand-400">${sess.timeSlot}</span>
            <span class="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">${sess.venue}</span>
            ${sess.isFull ? '<span class="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold">FULL</span>' : ''}
          </div>
          <h4 class="text-sm font-bold text-white mt-1">${sess.title}</h4>
          <p class="text-[11px] text-slate-400">${sess.speaker ? `Speaker: ${sess.speaker}` : ''}</p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <!-- Excel Download Button -->
          <a href="/api/export/session/${sess.id}/excel" download="${sess.title.replace(/\s+/g, '_')}_Attendees.xlsx" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 rounded-lg text-xs font-semibold transition">
            <i data-lucide="file-spreadsheet" class="w-3.5 h-3.5"></i>
            <span>Export Excel</span>
          </a>

          <!-- PDF Download Button -->
          <button onclick="exportSessionPDF('${sess.id}')" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 rounded-lg text-xs font-semibold transition">
            <i data-lucide="file-down" class="w-3.5 h-3.5"></i>
            <span>Export PDF</span>
          </button>

          <!-- Toggle View Attendees List -->
          <button onclick="toggleAttendeeList('${sess.id}')" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition">
            <i data-lucide="users" class="w-3.5 h-3.5"></i>
            <span>Attendees (${sessRegs.length})</span>
          </button>
        </div>
      </div>

      <!-- Capacity Bar -->
      <div class="space-y-1">
        <div class="flex justify-between text-[11px] text-slate-400">
          <span>Attendance Quota</span>
          <span class="font-mono">${sess.registeredCount} / ${sess.quota} filled (${sess.percentFilled}%)</span>
        </div>
        <div class="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
          <div class="${sess.isFull ? 'bg-rose-500' : 'bg-brand-500'} h-full rounded-full" style="width: ${sess.percentFilled}%"></div>
        </div>
      </div>

      <!-- Expandable Attendees List -->
      <div id="attendees-list-${sess.id}" class="hidden pt-3 border-t border-cardBorder/50">
        <div class="text-xs font-bold text-slate-300 mb-2">Registered Attendees:</div>
        ${sessRegs.length === 0 ? '<div class="text-xs text-slate-500 italic">No registrations for this session yet.</div>' : `
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            ${sessRegs.map((r, i) => `
              <div class="p-2 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <div class="font-bold text-white">${i + 1}. ${r.studentName}</div>
                  <div class="text-[10px] text-slate-400">${r.studentClass} • <span class="font-mono text-brand-400">${r.id}</span></div>
                </div>
                <button onclick="cancelRegistration('${r.id}')" title="Remove" class="text-slate-500 hover:text-rose-400 p-1">
                  <i data-lucide="x" class="w-3.5 h-3.5"></i>
                </button>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;

    container.appendChild(item);
  });

  lucide.createIcons({ root: container });
}

window.toggleAttendeeList = function(sessionId) {
  const el = document.getElementById(`attendees-list-${sessionId}`);
  if (el) {
    el.classList.toggle('hidden');
  }
};

// -------------------------------------------------------------
// PDF REPORT GENERATOR (jsPDF & AutoTable)
// -------------------------------------------------------------
window.exportSessionPDF = function(sessionId) {
  const session = state.sessions.find(s => s.id === sessionId);
  if (!session) return;

  const sessionRegs = state.registrations.filter(r => r.sessionId === sessionId);

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Branding Colors & Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 42, 'F');

  doc.setTextColor(249, 115, 22);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text("CALIPH DOMAIN CONCLAVE 2026", 14, 12);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text("CONFLUENCE - SESSION ATTENDANCE REPORT", 14, 22);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text("Caliph Life School, Thamarassery • Date: Tuesday, 10 November 2026", 14, 30);

  // Session Details Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 48, 182, 34, 3, 3, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(session.title, 18, 56);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Topic: ${session.subtitle || 'N/A'}`, 18, 62);
  doc.text(`Speaker: ${session.speaker} (${session.speakerRole || 'Keynote'})`, 18, 68);
  doc.text(`Venue: ${session.venue}  |  Time Slot: ${session.timeSlot}  |  Capacity: ${session.registeredCount} / ${session.quota} filled`, 18, 74);

  const tableRows = sessionRegs.map((r, index) => {
    const student = state.students.find(s => s.id === r.studentId);
    return [
      (index + 1).toString(),
      r.id,
      r.studentName,
      r.studentClass,
      student ? student.rollNo || '-' : '-',
      student ? student.phone || '-' : '-',
      new Date(r.registeredAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    ];
  });

  doc.autoTable({
    startY: 88,
    head: [['#', 'Pass ID', 'Student Name', 'Class / Grade', 'Roll No', 'Phone', 'Reg. Time']],
    body: tableRows.length > 0 ? tableRows : [['-', '-', 'No students registered yet', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: {
      fillColor: [234, 88, 12],
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: [30, 41, 59]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    didDrawPage: (data) => {
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Generated on ${new Date().toLocaleString('en-IN')} | Page ${data.pageNumber} of ${pageCount}`, 14, doc.internal.pageSize.height - 10);
      doc.text("Caliph Conclave Official Document", doc.internal.pageSize.width - 65, doc.internal.pageSize.height - 10);
    }
  });

  const safeFilename = `${session.title.replace(/\s+/g, '_')}_Attendees.pdf`;
  doc.save(safeFilename);
  showToast(`PDF generated: ${safeFilename}`, "success");
};

// -------------------------------------------------------------
// MASTER ALL PROGRAMS PDF (COMBINED AT ONCE)
// -------------------------------------------------------------
window.exportAllProgramsMasterPDF = function() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Branding Colors & Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 42, 'F');

  doc.setTextColor(249, 115, 22);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text("CALIPH DOMAIN CONCLAVE 2026", 14, 12);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text("CONFLUENCE - MASTER ALL PROGRAMS REPORT", 14, 22);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(`Official Conclave Master Attendance • Total Registrations: ${state.registrations.length}`, 14, 30);

  // Section 1: Executive Overview Table
  const summaryRows = state.sessions.map((s, idx) => [
    (idx + 1).toString(),
    s.title,
    s.venue,
    s.timeSlot,
    s.speaker || '-',
    `${s.registeredCount} / ${s.quota}`,
    `${s.percentFilled}%`,
    s.isFull ? 'FULL' : 'OPEN'
  ]);

  doc.autoTable({
    startY: 48,
    head: [['#', 'Program Title', 'Venue', 'Time Slot', 'Speaker', 'Seats', 'Filled', 'Status']],
    body: summaryRows,
    theme: 'grid',
    headStyles: {
      fillColor: [234, 88, 12],
      textColor: 255,
      fontSize: 8,
      fontStyle: 'bold'
    },
    styles: { fontSize: 7.5, cellPadding: 2.5, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] }
  });

  // Section 2: Detailed Attendee Lists per session
  state.sessions.forEach((session) => {
    doc.addPage();
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 28, 'F');

    doc.setTextColor(249, 115, 22);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`CONFLUENCE 2026 • ${session.venue.toUpperCase()}`, 14, 10);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.text(session.title, 14, 18);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text(`Time: ${session.timeSlot} | Speaker: ${session.speaker} | Attendees: ${session.registeredCount} / ${session.quota}`, 14, 24);

    const sRegs = state.registrations.filter(r => r.sessionId === session.id);
    const rows = sRegs.map((r, i) => {
      const st = state.students.find(x => x.id === r.studentId);
      return [
        (i + 1).toString(),
        r.id,
        r.studentName,
        r.studentClass,
        st ? st.rollNo || '-' : '-',
        new Date(r.registeredAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      ];
    });

    doc.autoTable({
      startY: 33,
      head: [['#', 'Pass ID', 'Student Name', 'Class / Grade', 'Roll No', 'Reg Time']],
      body: rows.length ? rows : [['-', '-', 'No registrations yet', '-', '-', '-']],
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 2.5, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });
  });

  doc.save("CONFLUENCE_Master_All_Programs_Report.pdf");
  showToast("Master All Programs PDF generated successfully!", "success");
};

// -------------------------------------------------------------
// STUDENT-WISE PARTICIPATION REPORT PDF (EACH STUDENT & SESSIONS)
// -------------------------------------------------------------
window.exportStudentsParticipationPDF = function() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('landscape');

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 297, 36, 'F');

  doc.setTextColor(249, 115, 22);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text("CALIPH COMMERCE DOMAIN CONCLAVE 2026", 14, 11);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text("STUDENT-WISE SESSION PARTICIPATION REPORT", 14, 21);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(`Total Students in Roster: ${state.students.length} • Total Registrations: ${state.registrations.length} • Generated: ${new Date().toLocaleString('en-IN')}`, 14, 29);

  const rows = state.students.map((st, idx) => {
    const studentRegs = state.registrations.filter(r => r.studentId === st.id);
    const sessionsList = studentRegs.length > 0
      ? studentRegs.map(r => `• ${r.sessionTitle} (${r.venue} - ${r.timeSlot})`).join('\n')
      : 'None (Not registered yet)';

    return [
      (idx + 1).toString(),
      st.id,
      st.name,
      st.className,
      st.rollNo || '-',
      studentRegs.length.toString(),
      sessionsList
    ];
  });

  doc.autoTable({
    startY: 42,
    head: [['#', 'Student ID', 'Student Name', 'Class / Grade', 'Roll No', 'Sessions', 'Participated Programs, Venues & Timings']],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [14, 116, 144],
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 25 },
      2: { cellWidth: 45 },
      3: { cellWidth: 32 },
      4: { cellWidth: 18 },
      5: { cellWidth: 20 },
      6: { cellWidth: 'auto' }
    },
    styles: { fontSize: 8, cellPadding: 3, valign: 'middle', textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didDrawPage: (data) => {
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Generated on ${new Date().toLocaleString('en-IN')} | Page ${data.pageNumber} of ${pageCount}`, 14, doc.internal.pageSize.height - 8);
      doc.text("Caliph Conclave Official Document", doc.internal.pageSize.width - 65, doc.internal.pageSize.height - 8);
    }
  });

  doc.save("CONFLUENCE_Students_Participation_Report.pdf");
  showToast("Students Participation PDF generated successfully!", "success");
};

// -------------------------------------------------------------
// SESSIONS MANAGEMENT CRUD
// -------------------------------------------------------------
function renderAdminSessionsTable() {
  const tbody = elements.adminSessionsTable;
  tbody.innerHTML = '';

  state.sessions.forEach(s => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-900/40 transition';
    tr.innerHTML = `
      <td class="px-4 py-3 font-mono font-medium text-brand-400">${s.timeSlot}</td>
      <td class="px-4 py-3">
        <div class="font-bold text-white">${s.title}</div>
        <div class="text-[11px] text-slate-400">${s.subtitle || ''}</div>
      </td>
      <td class="px-4 py-3 font-medium text-amber-300">${s.venue}</td>
      <td class="px-4 py-3 text-slate-300">${s.speaker}</td>
      <td class="px-4 py-3">
        <div class="font-mono">${s.registeredCount} / ${s.quota} seats</div>
        <div class="text-[10px] ${s.isFull ? 'text-rose-400 font-bold' : 'text-emerald-400'}">${s.isFull ? 'Quota Full' : `${s.remainingQuota} seats left`}</div>
      </td>
      <td class="px-4 py-3 text-right">
        <div class="inline-flex items-center gap-1.5">
          <button onclick="openEditSessionModal('${s.id}')" title="Edit Session" class="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition">
            <i data-lucide="edit-3" class="w-4 h-4"></i>
          </button>
          <button onclick="deleteSession('${s.id}')" title="Delete Session" class="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  lucide.createIcons({ root: tbody });
}

elements.btnCreateSessionModal.addEventListener('click', () => {
  document.getElementById('session-form-id').value = '';
  document.getElementById('modal-session-title').textContent = 'Add New Session';
  elements.formSession.reset();
  elements.modalSessionForm.classList.remove('hidden');
  elements.modalSessionForm.classList.add('flex');
});

elements.btnCloseSessionModal.addEventListener('click', closeSessionModal);
elements.btnCancelSessionModal.addEventListener('click', closeSessionModal);

function closeSessionModal() {
  elements.modalSessionForm.classList.add('hidden');
  elements.modalSessionForm.classList.remove('flex');
}

window.openEditSessionModal = function(sessionId) {
  const s = state.sessions.find(item => item.id === sessionId);
  if (!s) return;

  document.getElementById('session-form-id').value = s.id;
  document.getElementById('modal-session-title').textContent = 'Edit Conclave Session';
  document.getElementById('session-input-title').value = s.title;
  document.getElementById('session-input-subtitle').value = s.subtitle || '';
  document.getElementById('session-input-speaker').value = s.speaker || '';
  document.getElementById('session-input-speaker-role').value = s.speakerRole || '';
  document.getElementById('session-input-venue').value = s.venue;
  document.getElementById('session-input-quota').value = s.quota;
  document.getElementById('session-input-start').value = s.startTime || '';
  document.getElementById('session-input-end').value = s.endTime || '';
  document.getElementById('session-input-category').value = s.category || 'General';

  elements.modalSessionForm.classList.remove('hidden');
  elements.modalSessionForm.classList.add('flex');
};

elements.formSession.addEventListener('submit', async (e) => {
  e.preventDefault();
  const editId = document.getElementById('session-form-id').value;

  const sessionPayload = {
    title: document.getElementById('session-input-title').value,
    subtitle: document.getElementById('session-input-subtitle').value,
    speaker: document.getElementById('session-input-speaker').value,
    speakerRole: document.getElementById('session-input-speaker-role').value,
    venue: document.getElementById('session-input-venue').value,
    quota: document.getElementById('session-input-quota').value,
    startTime: document.getElementById('session-input-start').value,
    endTime: document.getElementById('session-input-end').value,
    category: document.getElementById('session-input-category').value
  };

  try {
    const url = editId ? `/api/sessions/${editId}` : '/api/sessions';
    const method = editId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionPayload)
    });

    const data = await res.json();
    if (res.ok) {
      showToast(data.message, "success");
      closeSessionModal();
      await fetchSessions();
    } else {
      showToast(data.error || "Failed to save session.", "error");
    }
  } catch (err) {
    console.error("Save session error:", err);
    showToast("Network error saving session.", "error");
  }
});

window.deleteSession = async function(sessionId) {
  if (!confirm("Are you sure you want to delete this session? All registrations for this session will also be removed.")) {
    return;
  }

  try {
    const res = await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) {
      showToast(data.message, "info");
      await fetchSessions();
      await fetchRegistrations();
    } else {
      showToast(data.error || "Failed to delete session.", "error");
    }
  } catch (err) {
    console.error("Delete session error:", err);
  }
};

// -------------------------------------------------------------
// STUDENTS ROSTER & EXCEL BULK IMPORT
// -------------------------------------------------------------
function renderAdminStudentsTable(filterText = '') {
  const tbody = elements.adminStudentsTable;
  tbody.innerHTML = '';

  let list = state.students;
  if (filterText) {
    const f = filterText.toLowerCase();
    list = list.filter(st => 
      st.name.toLowerCase().includes(f) || 
      st.className.toLowerCase().includes(f) ||
      st.id.toLowerCase().includes(f)
    );
  }

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="px-4 py-8 text-center text-slate-500">No students found. Upload an Excel list or add one above.</td></tr>`;
    return;
  }

  list.forEach((st, idx) => {
    const studentRegs = state.registrations.filter(r => r.studentId === st.id);
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-900/40 transition';
    tr.innerHTML = `
      <td class="px-4 py-2.5 font-mono text-slate-500 text-center">${idx + 1}</td>
      <td class="px-4 py-2.5 font-bold text-white">${st.name}</td>
      <td class="px-4 py-2.5 text-brand-300 font-bold">${st.className}</td>
      <td class="px-4 py-2.5 text-slate-300 font-mono">${st.rollNo || '-'}</td>
      <td class="px-4 py-2.5">
        <span class="px-2 py-0.5 rounded-full text-[10px] font-mono ${studentRegs.length > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}">
          ${studentRegs.length} session(s)
        </span>
      </td>
      <td class="px-4 py-2.5 text-right">
        <button onclick="deleteStudent('${st.id}')" title="Delete Student" class="p-1 text-slate-500 hover:text-rose-400 transition">
          <i data-lucide="trash" class="w-3.5 h-3.5"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  lucide.createIcons({ root: tbody });
}

elements.adminStudentSearch.addEventListener('input', (e) => {
  renderAdminStudentsTable(e.target.value.trim());
});

elements.formAddStudent.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('new-student-name').value;
  const className = document.getElementById('new-student-class').value;
  const rollNo = document.getElementById('new-student-roll').value;

  try {
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, className, rollNo })
    });

    const data = await res.json();
    if (res.ok) {
      showToast(data.message, "success");
      elements.formAddStudent.reset();
      await fetchStudents();
      updateStats();
    } else {
      showToast(data.error || "Failed to add student.", "error");
    }
  } catch (err) {
    console.error("Add student error:", err);
  }
});

window.deleteStudent = async function(studentId) {
  if (!confirm("Are you sure you want to remove this student and their session registrations?")) {
    return;
  }

  try {
    const res = await fetch(`/api/students/${studentId}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) {
      showToast(data.message, "info");
      if (state.activeStudent && state.activeStudent.id === studentId) {
        elements.btnClearStudent.click();
      }
      await fetchStudents();
      await fetchSessions();
      await fetchRegistrations();
      updateStats();
    }
  } catch (err) {
    console.error("Delete student error:", err);
  }
};

// Excel Drag & Drop and Upload
elements.excelDropzone.addEventListener('click', () => {
  elements.excelFileInput.click();
});

elements.excelDropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  elements.excelDropzone.classList.add('border-brand-500', 'bg-slate-900');
});

elements.excelDropzone.addEventListener('dragleave', () => {
  elements.excelDropzone.classList.remove('border-brand-500', 'bg-slate-900');
});

elements.excelDropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  elements.excelDropzone.classList.remove('border-brand-500', 'bg-slate-900');
  if (e.dataTransfer.files.length > 0) {
    uploadExcelFile(e.dataTransfer.files[0]);
  }
});

elements.excelFileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    uploadExcelFile(e.target.files[0]);
  }
});

async function uploadExcelFile(file) {
  const statusEl = elements.uploadStatus;
  statusEl.classList.remove('hidden');
  statusEl.className = 'mt-3 text-xs font-semibold text-brand-400';
  statusEl.innerHTML = `<i data-lucide="loader" class="w-3.5 h-3.5 animate-spin inline mr-1"></i> Uploading & parsing "${file.name}"...`;
  lucide.createIcons({ root: statusEl });

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch('/api/students/upload', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    if (res.ok) {
      statusEl.className = 'mt-3 text-xs font-semibold text-emerald-400';
      statusEl.textContent = `✓ ${data.message}`;
      showToast(data.message, "success");
      await fetchStudents();
      updateStats();
    } else {
      statusEl.className = 'mt-3 text-xs font-semibold text-rose-400';
      statusEl.textContent = `✗ ${data.error || 'Upload failed'}`;
      showToast(data.error || "Failed to process Excel file.", "error");
    }
  } catch (err) {
    console.error("Excel upload error:", err);
    statusEl.className = 'mt-3 text-xs font-semibold text-rose-400';
    statusEl.textContent = '✗ Network error uploading file.';
  }
}

// -------------------------------------------------------------
// ADMIN LOCK & PASSCODE PROTECTION (PIN: 786786)
// -------------------------------------------------------------
const ADMIN_LOCK_PIN = '786786';

function isAdminAuthenticated() {
  return sessionStorage.getItem('confluence_admin_unlocked') === 'true';
}

function openAdminLockModal() {
  if (elements.adminPinInput) {
    elements.adminPinInput.value = '';
    elements.adminPinInput.classList.remove('border-rose-500', 'ring-4', 'ring-rose-500/20');
  }
  if (elements.adminPinError) {
    elements.adminPinError.classList.add('hidden');
  }
  if (elements.modalAdminLock) {
    elements.modalAdminLock.classList.remove('hidden');
    elements.modalAdminLock.classList.add('flex');
    lucide.createIcons({ root: elements.modalAdminLock });
    setTimeout(() => {
      if (elements.adminPinInput) elements.adminPinInput.focus();
    }, 150);
  }
}

function closeAdminLockModal() {
  if (elements.modalAdminLock) {
    elements.modalAdminLock.classList.add('hidden');
    elements.modalAdminLock.classList.remove('flex');
  }
  if (elements.adminPinInput) {
    elements.adminPinInput.value = '';
  }
}

if (elements.formAdminLock) {
  elements.formAdminLock.addEventListener('submit', (e) => {
    e.preventDefault();
    const enteredPin = (elements.adminPinInput.value || '').trim();
    if (enteredPin === ADMIN_LOCK_PIN) {
      sessionStorage.setItem('confluence_admin_unlocked', 'true');
      closeAdminLockModal();
      showToast("🔓 Admin Panel Unlocked!", "success");
      
      // Reveal Admin Panel View
      elements.viewAdmin.classList.remove('hidden');
      elements.viewReg.classList.add('hidden');
      elements.navAdminBtn.classList.add('bg-brand-600', 'text-white');
      elements.navAdminBtn.classList.remove('text-slate-400');
      elements.navRegBtn.classList.remove('bg-brand-600', 'text-white');
      elements.navRegBtn.classList.add('text-slate-400');
      switchAdminTab(state.currentAdminTab);
    } else {
      if (elements.adminPinError) {
        elements.adminPinError.classList.remove('hidden');
      }
      elements.adminPinInput.classList.add('border-rose-500', 'ring-4', 'ring-rose-500/20');
      elements.adminPinInput.value = '';
      elements.adminPinInput.focus();
      showToast("❌ Incorrect Admin PIN! Access denied.", "error");
    }
  });
}

if (elements.btnCloseAdminLock) {
  elements.btnCloseAdminLock.addEventListener('click', closeAdminLockModal);
}
if (elements.btnCancelAdminLock) {
  elements.btnCancelAdminLock.addEventListener('click', closeAdminLockModal);
}

if (elements.btnLockAdmin) {
  elements.btnLockAdmin.addEventListener('click', () => {
    sessionStorage.removeItem('confluence_admin_unlocked');
    elements.navRegBtn.click();
    showToast("🔒 Admin Panel has been locked.", "info");
  });
}

// -------------------------------------------------------------
// NAVIGATION VIEW SWITCHER
// -------------------------------------------------------------
elements.navRegBtn.addEventListener('click', () => {
  elements.viewReg.classList.remove('hidden');
  elements.viewAdmin.classList.add('hidden');

  elements.navRegBtn.classList.add('bg-brand-600', 'text-white');
  elements.navRegBtn.classList.remove('text-slate-400');
  elements.navAdminBtn.classList.remove('bg-brand-600', 'text-white');
  elements.navAdminBtn.classList.add('text-slate-400');
});

elements.navAdminBtn.addEventListener('click', () => {
  if (!isAdminAuthenticated()) {
    openAdminLockModal();
    return;
  }

  elements.viewAdmin.classList.remove('hidden');
  elements.viewReg.classList.add('hidden');

  elements.navAdminBtn.classList.add('bg-brand-600', 'text-white');
  elements.navAdminBtn.classList.remove('text-slate-400');
  elements.navRegBtn.classList.remove('bg-brand-600', 'text-white');
  elements.navRegBtn.classList.add('text-slate-400');

  switchAdminTab(state.currentAdminTab);
});

elements.filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    elements.filterButtons.forEach(b => {
      b.classList.remove('active', 'bg-brand-600', 'text-white');
      b.classList.add('text-slate-400');
    });
    btn.classList.add('active', 'bg-brand-600', 'text-white');
    btn.classList.remove('text-slate-400');

    state.activeFilter = btn.getAttribute('data-filter');
    renderSessionsChecklist();
  });
});

// Clash Mode Switcher (Disappear vs Cut)
if (elements.btnModeDisappear && elements.btnModeCut) {
  elements.btnModeDisappear.addEventListener('click', () => {
    state.clashMode = 'disappear';
    elements.btnModeDisappear.className = 'px-2.5 py-1 rounded-lg text-[11px] font-bold transition bg-brand-600 text-white shadow-sm flex items-center gap-1';
    elements.btnModeCut.className = 'px-2.5 py-1 rounded-lg text-[11px] font-bold transition text-slate-400 hover:text-white hover:bg-slate-800 flex items-center gap-1';
    renderSessionsChecklist();
    showToast("Mode: Competing events at the same time slot will disappear.", "info");
  });

  elements.btnModeCut.addEventListener('click', () => {
    state.clashMode = 'cut';
    elements.btnModeCut.className = 'px-2.5 py-1 rounded-lg text-[11px] font-bold transition bg-brand-600 text-white shadow-sm flex items-center gap-1';
    elements.btnModeDisappear.className = 'px-2.5 py-1 rounded-lg text-[11px] font-bold transition text-slate-400 hover:text-white hover:bg-slate-800 flex items-center gap-1';
    renderSessionsChecklist();
    showToast("Mode: Competing events at the same time slot will be cut out with strike-through.", "info");
  });
}

// -------------------------------------------------------------
// APP INITIALIZATION
// -------------------------------------------------------------
async function initApp() {
  lucide.createIcons();
  await fetchSessions();
  await fetchStudents();
  await fetchRegistrations();
  await updateStats();
}

window.addEventListener('DOMContentLoaded', initApp);
