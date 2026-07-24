(function () {
  const departments = [
    { id: 'economic', name: 'Economic & Financial Management Studies' },
    { id: 'business', name: 'Business Management & Entrepreneurship Studies' },
    { id: 'localgov', name: 'Local Government & Legislative Studies' },
    { id: 'leadership', name: 'Leadership Development Studies' },
    { id: 'computer', name: 'Computer & Information Management Studies' },
    { id: 'public-admin', name: 'Public Administration Studies' },
    { id: 'management', name: 'Management Studies' },
    { id: 'consultancy', name: 'Management Consultancy Services' },
    { id: 'gender', name: 'Gender Studies' },
    { id: 'research', name: 'Research and Publications' },
    { id: 'planning', name: 'Planning & Strategy' },
    { id: 'library', name: 'Library' },
    { id: 'procurement', name: 'Procurement' },
    { id: 'finance', name: 'Finance and Accounts' },
    { id: 'hr', name: 'Human Resources' },
    { id: 'general-services', name: 'General Services and Corporate Affairs Department' },
    { id: 'special-duties', name: 'Special Duties, Internal Audit, and ICT' },
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

  function getPortal() {
    return window.PortalState ? PortalState.getState() : { complaints: [], announcements: [] };
  }

  function getComplaintCounts() {
    const complaints = getPortal().complaints || [];
    const open = complaints.filter((item) => item.status !== 'Closed').length;
    const pendingReplies = complaints.filter((item) => item.status === 'Pending').length;
    return { open, pendingReplies, total: complaints.length };
  }

  function getOnlineStaffCount() {
    return staff.filter((item) => item.online).length;
  }

  function getOnlineDepartments() {
    return departments.filter((department) => staff.some((member) => member.departmentId === department.id && member.online));
  }

  function formatComplaintCard(complaint, mode) {
    const department = departments.find((dept) => dept.id === complaint.departmentId);
    const replies = (complaint.replies || []).map((reply) => `
      <div class="border-t border-slate-200/60 pt-3 mt-3 space-y-1">
        <p class="text-sm font-semibold">${reply.role} reply</p>
        <p class="text-sm text-slate-700">${reply.message}</p>
        <p class="text-[11px] text-slate-500">${reply.createdAt}</p>
      </div>
    `).join('');

    const replySection = complaint.status !== 'Closed' ? `
      <form class="reply-form mt-4 space-y-3" data-complaint-id="${complaint.id}">
        <label class="block text-sm text-slate-700">
          Reply as ${mode === 'admin' ? 'Admin' : 'Staff'}
          <textarea class="w-full rounded-xl border border-slate-300 p-3 text-sm" rows="2" placeholder="Write your response"></textarea>
        </label>
        <button type="submit" class="inline-flex items-center rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500">Send reply</button>
      </form>
    ` : '';

    return `
      <article class="rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-xs uppercase tracking-[0.28em] text-slate-500">${department?.name || 'Unknown department'}</p>
            <h4 class="mt-2 text-lg font-semibold text-slate-900">${complaint.category}</h4>
          </div>
          <span class="rounded-full px-3 py-1 text-xs font-semibold ${complaint.status === 'Pending' ? 'bg-amber-100 text-amber-700' : complaint.status === 'Closed' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-700'}">${complaint.status}</span>
        </div>
        <p class="mt-3 text-sm text-slate-700">${complaint.message}</p>
        <p class="mt-3 text-xs text-slate-500">Submitted: ${complaint.createdAt}</p>
        ${replies || '<p class="mt-4 text-sm text-slate-500">No reply yet.</p>'}
        ${replySection}
      </article>
    `;
  }

  function renderAnnouncements(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const announcements = getPortal().announcements || [];
    if (!announcements.length) {
      container.innerHTML = '<p class="text-sm text-slate-500">No announcements yet. Admin announcements appear here.</p>';
      return;
    }
    container.innerHTML = announcements.map((note) => `
      <article class="rounded-3xl border border-slate-200/80 bg-slate-50 p-4 shadow-sm">
        <h4 class="font-semibold text-slate-900">${note.title}</h4>
        <p class="mt-2 text-sm text-slate-700">${note.message}</p>
        <p class="mt-3 text-[11px] text-slate-500">${note.createdAt}</p>
      </article>
    `).join('');
  }

  function renderStaffRoster() {
    const roster = document.getElementById('staff-list');
    if (!roster) return;
    const onlineCount = getOnlineStaffCount();
    if (!onlineCount) {
      roster.innerHTML = `
        <article class="rounded-3xl border border-slate-200/80 bg-white/80 p-5 text-center shadow-sm">
          <p class="text-sm text-slate-600">No staff members are currently online. Online availability will appear here when team members sign in.</p>
        </article>`;
      return;
    }

    roster.innerHTML = staff.map((person) => `
      <article class="rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-sm ${person.online ? '' : 'opacity-70'}">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="font-semibold text-slate-900">${person.name}</p>
            <p class="text-sm text-slate-500">${person.title}</p>
          </div>
          <span class="whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${person.online ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}">${person.online ? 'Online' : 'Offline'}</span>
        </div>
      </article>
    `).join('');
  }

  function renderStaffDashboard() {
    const counts = getComplaintCounts();
    document.getElementById('staff-online-count')?.textContent = String(getOnlineStaffCount());
    document.getElementById('staff-pending-count')?.textContent = String(counts.pendingReplies);
    document.getElementById('staff-open-count')?.textContent = String(counts.open);
    const statusPill = document.querySelector('.status-pill');
    if (statusPill) {
      const online = getOnlineStaffCount();
      statusPill.textContent = online ? 'Team active' : 'No staff online';
      statusPill.className = `status-pill rounded-full px-4 py-2 text-sm font-semibold ${online ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`;
    }
    renderStaffRoster();
    renderAnnouncements('staff-announcements');

    const complaints = getPortal().complaints || [];
    const complaintContainer = document.getElementById('staff-complaint-list');
    if (complaintContainer) {
      complaintContainer.innerHTML = complaints.length ? complaints.map((item) => formatComplaintCard(item, 'staff')).join('') : '<p class="text-sm text-slate-500">No complaints waiting for action.</p>';
      complaintContainer.querySelectorAll('.reply-form').forEach((form) => {
        form.addEventListener('submit', (event) => {
          event.preventDefault();
          const complaintId = form.dataset.complaintId;
          const textarea = form.querySelector('textarea');
          const message = textarea?.value.trim();
          if (!message) return;
          PortalState.addReply(complaintId, { responder: 'Staff member', message, role: 'Staff', status: 'Responded' });
          textarea.value = '';
          renderStaffDashboard();
        });
      });
    }
  }

  function renderAdminDashboard() {
    const portal = getPortal();
    const counts = getComplaintCounts();
    document.getElementById('summary-departments-count')?.textContent = String(departments.length);
    document.getElementById('summary-active-complaints-count')?.textContent = String(counts.open);
    document.getElementById('summary-pending-count')?.textContent = String(counts.pendingReplies);
    document.getElementById('summary-announcements-count')?.textContent = String((portal.announcements || []).length);

    const complaintContainer = document.getElementById('admin-complaint-list');
    if (complaintContainer) {
      complaintContainer.innerHTML = portal.complaints.length ? portal.complaints.map((item) => formatComplaintCard(item, 'admin')).join('') : '<p class="text-sm text-slate-500">No customer issues found yet.</p>';
      complaintContainer.querySelectorAll('.reply-form').forEach((form) => {
        form.addEventListener('submit', (event) => {
          event.preventDefault();
          const complaintId = form.dataset.complaintId;
          const textarea = form.querySelector('textarea');
          const message = textarea?.value.trim();
          if (!message) return;
          PortalState.addReply(complaintId, { responder: 'Admin', message, role: 'Admin', status: 'Responded' });
          textarea.value = '';
          renderAdminDashboard();
        });
      });
    }

    renderAnnouncements('admin-announcements');
    const taskList = document.getElementById('task-list');
    if (taskList) {
      taskList.innerHTML = portal.complaints.slice(0, 4).map((complaint) => {
        const department = departments.find((d) => d.id === complaint.departmentId);
        return `
          <article class="rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-sm">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="font-semibold text-slate-900">${department?.name || 'Unknown'}</p>
                <p class="mt-1 text-sm text-slate-600">${complaint.category}</p>
              </div>
              <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">${complaint.status}</span>
            </div>
          </article>
        `;
      }).join('') || '<p class="text-sm text-slate-500">No active tasks currently.</p>';
    }

    const statusGrid = document.getElementById('department-status-grid');
    if (statusGrid) {
      const onlineDepartments = getOnlineDepartments();
      if (!onlineDepartments.length) {
        statusGrid.innerHTML = `
          <article class="rounded-3xl border border-slate-200/80 bg-white/80 p-5 text-center shadow-sm">
            <p class="text-sm text-slate-600">No departments have online staff at the moment. Online department availability will appear when team members sign in.</p>
          </article>`;
      } else {
        statusGrid.innerHTML = onlineDepartments.map((department) => `
          <article class="rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-sm">
            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="font-semibold text-slate-900">${department.name}</p>
                <p class="text-sm text-slate-500">Team available</p>
              </div>
              <span class="rounded-full px-3 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700">Online</span>
            </div>
          </article>
        `).join('');
      }
    }
  }

  let toastTimeoutId = null;

  function showToast(message) {
    const toast = document.getElementById('staff-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove('hidden');
    toast.classList.add('visible');
    window.clearTimeout(toastTimeoutId);
    toastTimeoutId = window.setTimeout(() => {
      toast.classList.remove('visible');
      toast.classList.add('hidden');
    }, 3600);
  }

  function connectStorageListener(renderFn, options = {}) {
    window.addEventListener('storage', (event) => {
      if (event.key === window.PortalState?.STORAGE_KEY) {
        renderFn();
        if (options.showToastOnUpdate) {
          showToast('New admin announcement available.');
        }
      }
    });
  }

  function initStaffDashboard() {
    renderStaffDashboard();
    connectStorageListener(renderStaffDashboard, { showToastOnUpdate: true });
  }

  function initAdminDashboard() {
    const form = document.getElementById('announcement-form');
    form?.addEventListener('submit', (event) => {
      event.preventDefault();
      const title = document.getElementById('announcement-title')?.value.trim();
      const body = document.getElementById('announcement-body')?.value.trim();
      if (!title || !body) return;
      PortalState.addAnnouncement(title, body);
      form.reset();
      renderAdminDashboard();
    });

    const complaintForm = document.getElementById('admin-complaint-form');
    const departmentInput = document.getElementById('admin-complaint-department');
    if (departmentInput) {
      departmentInput.innerHTML = departments.map((department) => `
        <option value="${department.id}">${department.name}</option>
      `).join('');
    }

    complaintForm?.addEventListener('submit', (event) => {
      event.preventDefault();
      const departmentId = document.getElementById('admin-complaint-department')?.value;
      const category = document.getElementById('admin-complaint-category')?.value.trim();
      const message = document.getElementById('admin-complaint-message')?.value.trim();
      if (!departmentId || !category || !message) return;
      PortalState.addComplaint({ departmentId, category, message, staffId: null, author: 'Admin' });
      complaintForm.reset();
      renderAdminDashboard();
    });

    renderAdminDashboard();
    connectStorageListener(renderAdminDashboard);
  }

  window.DashboardSync = {
    initStaffDashboard,
    initAdminDashboard,
  };
})();
