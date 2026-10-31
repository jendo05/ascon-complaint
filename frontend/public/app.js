'use strict';

const customerState = {
  departments: [],
  staff: [],
  complaints: [],
  announcements: [],
  selectedDepartment: null,
  assignedStaffId: '',
};

const api = window.ServiceFlowApi;

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}

function statusLabel(status) {
  return ({
    open: 'Open',
    escalated: 'Escalated',
    pending_user_confirmation: 'Awaiting your confirmation',
    resolved: 'Resolved',
  })[status] || 'Unknown';
}

function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.toggle('toast-error', isError);
  toast.classList.remove('hidden');
  toast.classList.add('visible');
  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => {
    toast.classList.remove('visible');
    toast.classList.add('hidden');
  }, 4200);
}

function setBusy(button, busy, label) {
  if (!button) return;
  button.disabled = busy;
  if (busy) {
    button.dataset.previousLabel = button.textContent;
    button.textContent = label || 'Please wait…';
  } else if (button.dataset.previousLabel) {
    button.textContent = button.dataset.previousLabel;
    delete button.dataset.previousLabel;
  }
}

function renderSummary() {
  const openCount = customerState.complaints.filter((item) => item.status !== 'resolved').length;
  const pendingCount = customerState.complaints.filter((item) => item.status === 'pending_user_confirmation').length;
  const values = {
    'summary-departments-count': customerState.departments.length,
    'summary-open-count': openCount,
    'summary-pending-count': pendingCount,
  };
  Object.entries(values).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = String(value);
  });

  const heading = document.querySelector('.dashboard-welcome');
  const user = window.ServiceFlowAuth?.getCurrentUser();
  if (heading && user?.username) heading.textContent = `Welcome back, ${user.username}.`;
}

function renderDepartmentOptions() {
  const select = document.getElementById('complaint-department');
  if (!select) return;

  const selectedId = customerState.selectedDepartment?.id || select.value;
  const options = ['<option value="">Choose the department responsible for your issue</option>'];
  customerState.departments.forEach((department) => {
    options.push(`<option value="${escapeHtml(department.id)}">${escapeHtml(department.name)}</option>`);
  });
  select.innerHTML = options.join('');
  select.value = customerState.departments.some((item) => item.id === selectedId) ? selectedId : '';
  select.disabled = customerState.departments.length === 0;
}

function renderDepartments(message) {
  const container = document.getElementById('departments-list');
  if (!container) return;

  if (!customerState.departments.length) {
    container.innerHTML = `<p class="text-sm text-slate-400">${escapeHtml(message || 'No departments are available yet. Please try again later.')}</p>`;
    renderDepartmentOptions();
    return;
  }

  container.innerHTML = customerState.departments.map((department) => `
    <button type="button"
      class="department-card text-left ${customerState.selectedDepartment?.id === department.id ? 'active' : ''}"
      data-department-id="${escapeHtml(department.id)}"
      aria-pressed="${customerState.selectedDepartment?.id === department.id}">
      <span class="block font-semibold">${escapeHtml(department.name)}</span>
      <span class="mt-2 block text-sm">${escapeHtml(department.description || 'Submit a complaint to this department.')}</span>
      <span class="mt-3 inline-flex text-sm font-semibold text-sky-300">Choose department →</span>
    </button>
  `).join('');

  container.querySelectorAll('[data-department-id]').forEach((button) => {
    button.addEventListener('click', () => openDepartment(button.dataset.departmentId));
  });
  renderDepartmentOptions();
}

function renderStaff() {
  const container = document.getElementById('staff-list');
  const select = document.getElementById('complaint-staff');
  if (!container) return;

  if (!customerState.selectedDepartment) {
    container.innerHTML = '<p class="text-sm text-slate-400">Choose a department to see its staff contacts. You can submit a complaint without selecting a staff member.</p>';
    if (select) {
      select.innerHTML = '<option value="">No specific staff member</option>';
      select.value = '';
      select.disabled = true;
    }
    return;
  }

  const departmentStaff = customerState.staff.filter(
    (person) => person.department_id === customerState.selectedDepartment.id,
  );

  if (!departmentStaff.length) {
    container.innerHTML = '<p class="text-sm text-slate-400">No staff contacts are listed for this department yet. You can still submit your complaint to the department.</p>';
  } else {
    container.innerHTML = departmentStaff.map((person) => {
      const selected = customerState.assignedStaffId === person.id;
      return `
        <button type="button" class="staff-card clickable text-left ${selected ? 'selected' : ''}" data-staff-id="${escapeHtml(person.id)}" aria-pressed="${selected}">
          <strong>${escapeHtml(person.username || 'Department staff')}</strong>
          <div class="mt-1 text-sm">${escapeHtml(customerState.selectedDepartment.name)}</div>
          <div class="meta-row"><span class="meta-chip">${selected ? 'Selected for this complaint' : 'Department contact'}</span></div>
        </button>`;
    }).join('');
  }

  container.querySelectorAll('[data-staff-id]').forEach((button) => {
    button.addEventListener('click', () => {
      customerState.assignedStaffId = customerState.assignedStaffId === button.dataset.staffId ? '' : button.dataset.staffId;
      if (select) select.value = customerState.assignedStaffId;
      renderStaff();
    });
  });

  if (select) {
    const currentValue = customerState.assignedStaffId;
    select.innerHTML = [
      '<option value="">No specific staff member</option>',
      ...departmentStaff.map((person) => `<option value="${escapeHtml(person.id)}">${escapeHtml(person.username || 'Department staff')}</option>`),
    ].join('');
    select.value = currentValue;
    select.disabled = false;
    if (currentValue && !departmentStaff.some((person) => person.id === currentValue)) {
      customerState.assignedStaffId = '';
      select.value = '';
    }
  }
}

function renderDepartmentDetail() {
  const title = document.getElementById('department-title');
  const subtitle = document.getElementById('department-subtitle');
  const detail = document.getElementById('department-detail');
  const responseCard = document.getElementById('response-card');
  const status = document.getElementById('global-status');
  const complaintDepartment = document.getElementById('complaint-department');
  if (!customerState.selectedDepartment) return;

  if (title) title.textContent = customerState.selectedDepartment.name;
  if (subtitle) subtitle.textContent = customerState.selectedDepartment.description || 'Submit your complaint to this department.';
  if (status) status.textContent = 'Department selected';
  if (detail) {
    detail.classList.remove('hidden');
    const departmentComplaints = customerState.complaints.filter(
      (item) => item.department_id === customerState.selectedDepartment.id,
    );
    detail.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div><h3 class="text-lg font-semibold">Department overview</h3><p class="mt-1 text-sm text-slate-400">Your complaint will be sent to this department.</p></div>
        <span class="meta-chip">${departmentComplaints.length} of your request(s)</span>
      </div>`;
  }
  if (responseCard) {
    responseCard.classList.remove('hidden');
    responseCard.innerHTML = `
      <h3 class="text-lg font-semibold text-white">What happens next?</h3>
      <p class="mt-2 text-sm text-slate-400">Your complaint is recorded against this department. Staff or administrators can reply and update its status. You can confirm a resolution from the complaint card when it is ready.</p>`;
  }
  if (complaintDepartment) complaintDepartment.value = customerState.selectedDepartment.id;
  renderDepartments();
  renderStaff();
}

function renderComplaints() {
  const container = document.getElementById('customer-complaint-list');
  if (!container) return;
  if (!customerState.complaints.length) {
    container.innerHTML = '<p class="muted">You have not submitted a complaint yet. Use the complaint form to send your first request.</p>';
    return;
  }

  container.innerHTML = customerState.complaints.map((complaint) => {
    const department = complaint.departments?.name || customerState.departments.find((item) => item.id === complaint.department_id)?.name || 'Department';
    const replies = (complaint.replies || []).map((reply) => `
      <div class="reply-item">
        <strong>Response · ${escapeHtml(reply.sender?.username || 'Department staff')}</strong>
        <p>${escapeHtml(reply.message)}</p>
        <small>${escapeHtml(formatDate(reply.created_at))}</small>
      </div>`).join('');
    const confirmAction = complaint.status === 'pending_user_confirmation'
      ? `<button type="button" class="button primary confirm-resolution" data-complaint-id="${escapeHtml(complaint.id)}">Confirm resolution</button>`
      : '';
    return `
      <article class="complaint-item">
        <div class="complaint-header">
          <strong>${escapeHtml(department)} · ${escapeHtml(complaint.title)}</strong>
          <span class="meta-chip status-${escapeHtml(complaint.status)}">${escapeHtml(statusLabel(complaint.status))}</span>
        </div>
        <p>${escapeHtml(complaint.description)}</p>
        <div class="complaint-meta">Submitted: ${escapeHtml(formatDate(complaint.created_at))}${complaint.assigned_staff?.username ? ` · Assigned to ${escapeHtml(complaint.assigned_staff.username)}` : ''}</div>
        ${replies || '<p class="muted">No response yet.</p>'}
        ${confirmAction}
      </article>`;
  }).join('');

  container.querySelectorAll('.confirm-resolution').forEach((button) => {
    button.addEventListener('click', async () => {
      setBusy(button, true, 'Updating…');
      try {
        await api.updateComplaintStatus(button.dataset.complaintId, 'resolved');
        await refreshData();
        showToast('Resolution confirmed. Thank you.');
      } catch (error) {
        setBusy(button, false);
        showToast(error.message, true);
      }
    });
  });
}

function renderAnnouncements() {
  const container = document.getElementById('notification-list');
  if (!container) return;
  if (!customerState.announcements.length) {
    container.innerHTML = '<p class="text-sm text-slate-400">There are no announcements at the moment.</p>';
    return;
  }
  container.innerHTML = customerState.announcements.map((note) => `
    <article class="notification-item">
      <strong>${escapeHtml(note.title)}</strong>
      <p>${escapeHtml(note.message)}</p>
      <small>${escapeHtml(formatDate(note.created_at))}</small>
    </article>`).join('');
}

async function refreshData() {
  const [complaintsResult, announcementsResult] = await Promise.allSettled([
    api.getComplaints(),
    api.getAnnouncements(),
  ]);

  if (complaintsResult.status === 'fulfilled') {
    customerState.complaints = complaintsResult.value;
    renderComplaints();
  } else {
    const list = document.getElementById('customer-complaint-list');
    if (list) list.innerHTML = '<p class="text-sm text-rose-300">Your complaints could not be loaded. Refresh the page to try again.</p>';
    console.error('Unable to load customer complaints:', complaintsResult.reason);
  }

  if (announcementsResult.status === 'fulfilled') {
    customerState.announcements = announcementsResult.value;
    renderAnnouncements();
  } else {
    const list = document.getElementById('notification-list');
    if (list) list.innerHTML = '<p class="text-sm text-slate-400">Announcements are temporarily unavailable.</p>';
    console.error('Unable to load announcements:', announcementsResult.reason);
  }

  renderSummary();
  if (customerState.selectedDepartment) renderDepartmentDetail();
}

async function openDepartment(departmentId) {
  const department = customerState.departments.find((item) => item.id === departmentId);
  if (!department) return;

  customerState.selectedDepartment = department;
  customerState.assignedStaffId = '';
  customerState.staff = [];
  renderDepartmentDetail();

  const status = document.getElementById('global-status');
  if (status) status.textContent = 'Loading department contacts…';

  try {
    customerState.staff = await api.getStaff(department.id);
  } catch (error) {
    // Staff lookup is optional; it must never block complaint submission.
    customerState.staff = [];
    console.error('Unable to load department staff:', error);
    showToast('Staff contacts could not be loaded, but you can still submit your complaint.', true);
  }

  if (status) status.textContent = 'Ready to receive your complaint';
  renderStaff();
}

function wireEvents() {
  const departmentSelect = document.getElementById('complaint-department');
  departmentSelect?.addEventListener('change', () => {
    if (departmentSelect.value) {
      openDepartment(departmentSelect.value);
    } else {
      customerState.selectedDepartment = null;
      customerState.staff = [];
      customerState.assignedStaffId = '';
      const title = document.getElementById('department-title');
      const subtitle = document.getElementById('department-subtitle');
      const detail = document.getElementById('department-detail');
      const responseCard = document.getElementById('response-card');
      const status = document.getElementById('global-status');
      if (title) title.textContent = 'Select a department';
      if (subtitle) subtitle.textContent = 'Choose a department to submit your complaint and monitor its response.';
      detail?.classList.add('hidden');
      responseCard?.classList.add('hidden');
      if (status) status.textContent = 'Online';
      renderDepartments();
      renderStaff();
    }
  });

  const staffSelect = document.getElementById('complaint-staff');
  staffSelect?.addEventListener('change', () => {
    customerState.assignedStaffId = staffSelect.value;
    renderStaff();
  });

  const form = document.getElementById('complaint-form');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const departmentId = departmentSelect?.value || customerState.selectedDepartment?.id;
    const department = customerState.departments.find((item) => item.id === departmentId);
    if (!department) {
      showToast('Please choose a department before submitting your complaint.', true);
      departmentSelect?.focus();
      return;
    }

    customerState.selectedDepartment = department;
    const button = form.querySelector('button[type="submit"]');
    const category = document.getElementById('complaint-category').value;
    const description = document.getElementById('complaint-text').value.trim();
    const assignedTo = staffSelect?.value || null;
    if (!description) {
      showToast('Please describe your issue.', true);
      document.getElementById('complaint-text')?.focus();
      return;
    }

    setBusy(button, true, 'Submitting…');
    try {
      await api.createComplaint({
        department_id: department.id,
        title: category,
        description,
        assigned_to: assignedTo,
      });
      form.reset();
      customerState.assignedStaffId = '';
      customerState.selectedDepartment = department;
      renderDepartmentOptions();
      await refreshData();
      renderStaff();
      showToast('Your complaint has been submitted successfully.');
    } catch (error) {
      showToast(error.message || 'Unable to submit your complaint. Please try again.', true);
    } finally {
      setBusy(button, false);
    }
  });

  document.querySelectorAll('.logout-button').forEach((button) => {
    button.addEventListener('click', async () => {
      setBusy(button, true, 'Signing out…');
      try { await window.ServiceFlowAuth.logout(); } catch (_error) { /* Local session is still cleared. */ }
      window.location.replace('login.html');
    });
  });
}

async function initCustomerDashboard() {
  const allowed = await window.ServiceFlowAuthReady;
  if (!allowed) return;

  wireEvents();
  renderDepartmentOptions();
  renderStaff();

  const status = document.getElementById('global-status');
  if (status) status.textContent = 'Loading departments…';

  try {
    // Load departments independently. Staff lookup is deferred until a department is selected
    // so an optional directory failure cannot blank the dashboard or hide the complaint form.
    customerState.departments = await api.getDepartments();
    renderDepartments();
    renderSummary();
    if (status) status.textContent = customerState.departments.length ? 'Online' : 'No departments available';
  } catch (error) {
    renderDepartments('Departments could not be loaded. Check your connection and refresh the page.');
    if (status) status.textContent = 'Departments unavailable';
    showToast(error.message || 'Unable to load departments.', true);
    console.error('Unable to load departments:', error);
  }

  await refreshData();
  window.setInterval(() => refreshData().catch((error) => console.error('Dashboard refresh failed:', error)), 60000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      refreshData().catch((error) => console.error('Dashboard refresh failed:', error));
    }
  });
}

initCustomerDashboard().catch((error) => {
  console.error('Customer dashboard initialization failed:', error);
  showToast('The dashboard could not finish loading. Refresh the page to try again.', true);
});
