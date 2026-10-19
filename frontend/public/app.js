const state = {
  selectedDepartment: null,
  assignedStaffId: null,
  notifications: [],
  complaints: [],
  ratings: [],
  onlineStatus: {},
  lastActivity: Date.now(),
};

const departments = [
  { id: 'economic', name: 'Economic & Financial Management Studies', description: 'Finance policies, budget queries, and reports.' },
  { id: 'business', name: 'Business Management & Entrepreneurship Studies', description: 'Business planning, entrepreneurship, and advisory support.' },
  { id: 'localgov', name: 'Local Government & Legislative Studies', description: 'Local governance, legislative support, and policy guidance.' },
  { id: 'leadership', name: 'Leadership Development Studies', description: 'Leadership programs, training and performance coaching.' },
  { id: 'computer', name: 'Computer & Information Management Studies', description: 'IT services, system support, and digital operations.' },
  { id: 'public-admin', name: 'Public Administration Studies', description: 'Administration support, public affairs, and service delivery.' },
  { id: 'management', name: 'Management Studies', description: 'Operational management, quality assurance, and monitoring.' },
  { id: 'consultancy', name: 'Management Consultancy Services', description: 'Consultancy support, strategy and business advice.' },
  { id: 'gender', name: 'Gender Studies', description: 'Gender policy, equity services and support.' },
  { id: 'research', name: 'Research and Publications', description: 'Research coordination, publication services, and reports.' },
  { id: 'planning', name: 'Planning & Strategy', description: 'Strategic planning, programme design, and evaluation.' },
  { id: 'library', name: 'Library', description: 'Resource access, library support, and information services.' },
  { id: 'procurement', name: 'Procurement', description: 'Purchase requests, supplier engagement, and purchase order support.' },
  { id: 'finance', name: 'Finance and Accounts', description: 'Payments, invoicing, billing, and account reconciliation.' },
  { id: 'hr', name: 'Human Resources', description: 'Staff services, benefits, recruitment, and performance review.' },
  { id: 'general-services', name: 'General Services and Corporate Affairs Department', description: 'Facilities, event support, and general corporate services.' },
  { id: 'special-duties', name: 'Special Duties, Internal Audit, and ICT', description: 'Director-General support, audit, and administrative oversight.' },
];

const staff = [
  { id: 's1', name: 'Peace A.', title: 'Head of Finance', departmentId: 'economic', online: true },
  { id: 's2', name: 'Samuel B.', title: 'Procurement Specialist', departmentId: 'procurement', online: false },
  { id: 's3', name: 'Rita C.', title: 'HR Advisor', departmentId: 'hr', online: true },
  { id: 's4', name: 'David D.', title: 'ICT Support Lead', departmentId: 'special-duties', online: true },
  { id: 's5', name: 'Grace E.', title: 'Research Coordinator', departmentId: 'research', online: false },
  { id: 's6', name: 'Chinwe F.', title: 'Library Assistant', departmentId: 'library', online: true },
  { id: 's7', name: 'Tunde G.', title: 'General Services Officer', departmentId: 'general-services', online: false },
  { id: 's8', name: 'Aisha H.', title: 'Leadership Coach', departmentId: 'leadership', online: true },
  { id: 's9', name: 'Olu J.', title: 'Public Admin Advisor', departmentId: 'public-admin', online: true },
  { id: 's10', name: 'Musa K.', title: 'Operations Manager', departmentId: 'management', online: true },
];

const serviceBus = new EventTarget();

const DepartmentService = {
  getAll: async () => departments,
  getById: async (id) => departments.find((dept) => dept.id === id),
};

const StaffService = {
  getByDepartment: async (departmentId) => staff.filter((item) => item.departmentId === departmentId),
  getAll: async () => staff,
  getById: async (id) => staff.find((item) => item.id === id),
  setOnline: async (id, online) => {
    const person = await StaffService.getById(id);
    if (person) {
      person.online = online;
      serviceBus.dispatchEvent(new CustomEvent('staff-change', { detail: person }));
    }
  },
  getStatus: async () => Object.fromEntries(staff.map((item) => [item.id, item.online])),
};

const ComplaintService = {
  submit: async ({ departmentId, category, message, staffId }) => {
    const portal = PortalState.addComplaint({ departmentId, category, message, staffId, author: 'Customer' });
    state.complaints = portal.complaints || [];
    persistState();
    const complaint = state.complaints.find((item) => item.departmentId === departmentId && item.message === message && item.category === category);
    serviceBus.dispatchEvent(new CustomEvent('complaint-update', { detail: complaint }));
    return complaint;
  },
  getByDepartment: async (departmentId) => (PortalState.getState().complaints || []).filter((item) => item.departmentId === departmentId),
};

const RatingService = {
  submit: async ({ score, comment }) => {
    const rating = { id: `rating-${Date.now()}`, score, comment, date: new Date().toLocaleDateString() };
    state.ratings.push(rating);
    persistState();
    serviceBus.dispatchEvent(new CustomEvent('rating-update', { detail: rating }));
    return rating;
  },
  getAverage: async () => {
    if (!state.ratings.length) return 0;
    return state.ratings.reduce((sum, item) => sum + item.score, 0) / state.ratings.length;
  },
  getCount: async () => state.ratings.length,
};

const NotificationService = {
  announce: async (title, detail) => {
    const portal = PortalState.addAnnouncement(title, detail);
    state.notifications = portal.announcements || [];
    persistState();
    const notice = state.notifications[0] || { title, detail, createdAt: new Date().toLocaleTimeString() };
    serviceBus.dispatchEvent(new CustomEvent('notification', { detail: notice }));
    return notice;
  },
  getAll: async () => PortalState.getState().announcements || [],
};

function persistState() {
  try {
    localStorage.setItem('customerServiceState', JSON.stringify(state));
  } catch (error) {
    console.warn('Could not persist state', error);
  }
}

function hydrateState() {
  try {
    const stored = localStorage.getItem('customerServiceState');
    if (stored) {
      const parsed = JSON.parse(stored);
      state.ratings = parsed.ratings || [];
    }
    if (window.PortalState) {
      const portal = PortalState.getState();
      state.complaints = portal.complaints || [];
      state.notifications = portal.announcements || [];
    }
  } catch (error) {
    console.warn('Could not restore persisted state', error);
  }
}

function renderCustomerComplaints() {
  const container = document.getElementById('customer-complaint-list');
  if (!container) return;
  if (!state.complaints.length) {
    container.innerHTML = '<p class="muted">No complaints submitted yet.</p>';
    return;
  }

  container.innerHTML = state.complaints.map((complaint) => {
    const department = departments.find((dept) => dept.id === complaint.departmentId);
    const replies = (complaint.replies || []).map((reply) => `
      <div class="reply-item">
        <strong>${reply.role} reply</strong>
        <p>${reply.message}</p>
        <small>${reply.createdAt}</small>
      </div>
    `).join('');
    return `
      <article class="complaint-item">
        <div class="complaint-header">
          <strong>${department?.name || 'Unknown Department'}</strong>
          <span class="meta-chip status-${complaint.status.toLowerCase()}">${complaint.status}</span>
        </div>
        <p>${complaint.category} — ${complaint.message}</p>
        <div class="complaint-meta">Submitted: ${complaint.createdAt}</div>
        ${replies ? `<div class="complaint-replies">${replies}</div>` : '<p class="muted">No reply yet.</p>'}
      </article>
    `;
  }).join('');
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3200);
}

async function renderDepartments() {
  const container = document.getElementById('departments-list');
  const list = await DepartmentService.getAll();
  container.innerHTML = list.map((dept) => {
    const active = state.selectedDepartment?.id === dept.id ? 'active' : '';
    return `
      <article class="department-card ${active}" data-id="${dept.id}">
        <h3>${dept.name}</h3>
        <p>${dept.description}</p>
      </article>`;
  }).join('');
  container.querySelectorAll('.department-card').forEach((card) => {
    card.addEventListener('click', () => {
      const departmentId = card.dataset.id;
      openDepartment(departmentId);
    });
  });
}

async function renderStaffPanel() {
  const list = state.selectedDepartment ? await StaffService.getByDepartment(state.selectedDepartment.id) : await StaffService.getAll();
  const onlineStaff = list.filter((person) => person.online);
  const container = document.getElementById('staff-list');
  if (!onlineStaff.length) {
    container.innerHTML = '<p class="text-sm text-slate-400">No staff are online right now. Online availability will appear here when team members sign in.</p>';
  } else {
    container.innerHTML = onlineStaff.map((person) => `
      <article class="staff-card clickable ${state.assignedStaffId === person.id ? 'selected' : ''}" data-id="${person.id}">
        <strong>${person.name}</strong>
        <div>${person.title}</div>
        <div class="meta-row">
          <span class="meta-chip">${departments.find((dept) => dept.id === person.departmentId)?.name || 'Unknown'}</span>
          <span class="staff-status-chip online">Online</span>
        </div>
      </article>`).join('');

    container.querySelectorAll('.staff-card.clickable').forEach((card) => {
      card.addEventListener('click', () => {
        const staffId = card.dataset.id;
        state.assignedStaffId = staffId;
        document.getElementById('complaint-staff').value = staffId;
        renderStaffPanel();
        showToast('Complaint will be directed to selected staff member');
      });
    });
  }
  await renderStaffSelection();
  updateGlobalStatus();
}

function updateGlobalStatus() {
  const statusPill = document.getElementById('global-status');
  if (!statusPill) return;
  const onlineStaff = state.selectedDepartment ? staff.filter((person) => person.departmentId === state.selectedDepartment.id && person.online) : staff.filter((person) => person.online);
  if (!onlineStaff.length) {
    statusPill.textContent = 'No staff online';
    statusPill.className = 'status-pill inline-flex rounded-full bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-200';
  } else {
    statusPill.textContent = `${onlineStaff.length} staff online`;
    statusPill.className = 'status-pill inline-flex rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700';
  }
}

async function renderStaffSelection() {
  const select = document.getElementById('complaint-staff');
  if (!select) return;
  const list = state.selectedDepartment ? await StaffService.getByDepartment(state.selectedDepartment.id) : [];
  const available = list.sort((a, b) => Number(b.online) - Number(a.online));
  const options = ['<option value="">Any available staff</option>'];
  available.forEach((person) => {
    options.push(
      `<option value="${person.id}">${person.name} ${person.online ? '(Online)' : '(Offline)'}</option>`
    );
  });
  select.innerHTML = options.join('');
  if (state.assignedStaffId) {
    select.value = state.assignedStaffId;
  }
}

async function renderRatingSummary() {
  const ratingSummary = document.getElementById('rating-summary');
  if (!ratingSummary) return;
  const average = await RatingService.getAverage();
  const count = await RatingService.getCount();
  ratingSummary.innerHTML = `
    <div>
      <strong>${count ? average.toFixed(1) : '--'}</strong>
      <p>${count ? `${count} reviews submitted` : 'No ratings yet'}</p>
    </div>`;
}

async function renderNotifications() {
  const list = await NotificationService.getAll();
  const container = document.getElementById('notification-list');
  const badge = document.getElementById('badge-notifications');
  if (badge) {
    badge.textContent = list.length;
  }
  if (!container) return;
  if (!list.length) {
    container.innerHTML = '<p>No announcements yet. Admin announcements will appear here.</p>';
    return;
  }
  container.innerHTML = list.map((note) => `
    <article class="notification-item">
      <strong>${note.title}</strong>
      <p>${note.message || note.detail}</p>
      <small>${note.createdAt}</small>
    </article>
  `).join('');
}

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function openDepartment(id) {
  const department = await DepartmentService.getById(id);
  state.selectedDepartment = department;
  state.assignedStaffId = null;
  state.lastActivity = Date.now();
  document.getElementById('department-title').textContent = department.name;
  document.getElementById('department-subtitle').textContent = department.description;
  document.getElementById('department-detail').classList.remove('hidden');
  document.getElementById('complaint-card').classList.remove('hidden');
  document.getElementById('response-card').classList.remove('hidden');
  renderDepartmentDetail();
  renderDepartments();
  renderStaffPanel();
}

async function renderDepartmentDetail() {
  if (!state.selectedDepartment) return;
  const complaints = await ComplaintService.getByDepartment(state.selectedDepartment.id);
  const card = document.getElementById('department-detail');
  card.innerHTML = `
    <div class="card-header">
      <div>
        <h3>${state.selectedDepartment.name}</h3>
        <p>${state.selectedDepartment.description}</p>
      </div>
      <span class="meta-chip">${complaints.length} complaint${complaints.length === 1 ? '' : 's'}</span>
    </div>
    <div class="meta-row">
      <span class="meta-chip">Current request sent to ICT and department</span>
      <span class="meta-chip">Support status: ${state.selectedDepartment.id === 'computer' || state.selectedDepartment.id === 'special-duties' ? 'High priority' : 'Standard'}</span>
    </div>
    <div style="margin-top:18px;">
      <strong>Recent department updates:</strong>
      <ul style="margin: 12px 0 0 18px; color:#cbd5e1;">
        ${complaints.slice(-3).map((item) => `<li>${item.category} - <em>${item.status}</em></li>`).join('') || '<li>No active complaint yet.</li>'}
      </ul>
    </div>`;
}

async function openNotifications() {
  const notificationPanel = document.getElementById('notification-panel');
  if (notificationPanel) notificationPanel.classList.toggle('hidden');
  renderNotifications();
}

async function openRatingModal() {
  const score = prompt('Rate your overall experience from 1 to 5 stars');
  const numeric = Number(score);
  if (!numeric || numeric < 1 || numeric > 5) {
    showToast('Please provide a valid rating between 1 and 5');
    return;
  }
  const comment = prompt('Share a short comment about your treatment experience');
  await RatingService.submit({ score: numeric, comment: comment || 'No comment' });
  await renderRatingSummary();
  showToast('Thank you for your feedback!');
}

async function startSimulations() {
  setInterval(() => {
    const randomIndex = Math.floor(Math.random() * departments.length);
    const department = departments[randomIndex];
    const summary = `Reminder: ${department.name} is available for support today.`;
    NotificationService.announce('Department bulletin', summary);
  }, 32000);

  setInterval(() => {
    const item = staff[Math.floor(Math.random() * staff.length)];
    item.online = !item.online;
    serviceBus.dispatchEvent(new CustomEvent('staff-change', { detail: item }));
    renderStaffPanel();
  }, 28000);

  setInterval(() => {
    if (!state.selectedDepartment) return;
    const inactivity = Date.now() - state.lastActivity;
    if (inactivity > 25000) {
      NotificationService.announce('ICT Intervention', `ICT has reviewed ${state.selectedDepartment.name} and is intervening to support unresolved cases.`);
    }
  }, 22000);
}

function wireEvents() {
  document.getElementById('complaint-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!state.selectedDepartment) {
      showToast('Please select a department first.');
      return;
    }
    const category = document.getElementById('complaint-category').value;
    const message = document.getElementById('complaint-text').value.trim();
    const staffId = document.getElementById('complaint-staff').value || null;
    if (!message) {
      showToast('Please describe your issue.');
      return;
    }
    const complaint = await ComplaintService.submit({ departmentId: state.selectedDepartment.id, category, message, staffId });
    const receiver = staffId ? await StaffService.getById(staffId) : null;
    showToast(`Complaint submitted successfully${receiver ? ` to ${receiver.name}` : ''}.`);
    document.getElementById('complaint-text').value = '';
    state.assignedStaffId = null;
    await renderStaffPanel();
    renderDepartmentDetail();
    renderCustomerComplaints();
    renderCustomerSummary();
  });

  const btnNotifications = document.getElementById('btn-notifications');
  const btnShowRating = document.getElementById('btn-show-rating');

  if (btnNotifications) {
    btnNotifications.addEventListener('click', openNotifications);
  }

  if (btnShowRating) {
    btnShowRating.addEventListener('click', openRatingModal);
  }

  serviceBus.addEventListener('notification', () => {
    renderNotifications();
  });
  serviceBus.addEventListener('staff-change', () => {
    renderStaffPanel();
  });
}

function renderCustomerSummary() {
  const openCountEl = document.getElementById('summary-open-count');
  const departmentCountEl = document.getElementById('summary-departments-count');
  const pendingCountEl = document.getElementById('summary-pending-count');
  const portal = window.PortalState ? PortalState.getState() : { complaints: [] };
  const openCount = (portal.complaints || []).filter((item) => item.status !== 'Closed').length;
  const pendingCount = (portal.complaints || []).filter((item) => item.status === 'Pending').length;
  if (openCountEl) openCountEl.textContent = String(openCount);
  if (departmentCountEl) departmentCountEl.textContent = String(departments.length);
  if (pendingCountEl) pendingCountEl.textContent = String(pendingCount);
}

async function init() {
  hydrateState();
  await renderDepartments();
  await renderStaffPanel();
  await renderRatingSummary();
  await renderNotifications();
  renderCustomerComplaints();
  renderCustomerSummary();
  wireEvents();
  if (window.PortalState) {
    window.addEventListener('storage', (event) => {
      if (event.key === PortalState.STORAGE_KEY) {
        const portal = PortalState.getState();
        state.complaints = portal.complaints || [];
        state.notifications = portal.announcements || [];
        renderCustomerComplaints();
        renderNotifications();
        renderCustomerSummary();
        if (state.selectedDepartment) renderDepartmentDetail();
      }
    });
  }
  await startSimulations();
  showToast('Customer Service dashboard ready');
}

init();
