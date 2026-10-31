(function () {
  'use strict';

  const api = window.ServiceFlowApi;
  const state = { complaints: [], departments: [], staff: [], announcements: [] };

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[character]);
  }

  function dateLabel(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
  }

  function labelStatus(status) {
    return ({
      open: 'Open',
      escalated: 'Escalated',
      pending_user_confirmation: 'Awaiting customer',
      resolved: 'Resolved',
    })[status] || 'Unknown';
  }

  function toast(message, isError = false) {
    const element = document.getElementById('staff-toast') || document.getElementById('admin-toast');
    if (!element) return;
    element.textContent = message;
    element.classList.toggle('toast-error', isError);
    element.classList.remove('hidden');
    element.classList.add('visible');
    window.clearTimeout(toast.timeoutId);
    toast.timeoutId = window.setTimeout(() => { element.classList.remove('visible'); element.classList.add('hidden'); }, 3600);
  }

  function setBusy(button, busy, label = 'Saving…') {
    if (!button) return;
    if (busy) {
      button.dataset.previousLabel = button.textContent;
      button.disabled = true;
      button.textContent = label;
    } else {
      button.disabled = false;
      if (button.dataset.previousLabel) button.textContent = button.dataset.previousLabel;
      delete button.dataset.previousLabel;
    }
  }

  function departmentName(id) {
    return state.departments.find((item) => item.id === id)?.name || 'Unknown department';
  }

  function complaintCard(complaint, allowStatusChanges) {
    const replies = (complaint.replies || []).map((reply) => `
      <div class="mt-3 border-t border-slate-200/60 pt-3 space-y-1">
        <p class="text-sm font-semibold">Response</p>
        <p class="text-[11px] text-slate-500">${escapeHtml(reply.sender?.username || 'Portal user')}</p>
        <p class="text-sm text-slate-700">${escapeHtml(reply.message)}</p>
        <p class="text-[11px] text-slate-500">${escapeHtml(dateLabel(reply.created_at))}</p>
      </div>`).join('');
    const isAdmin = window.ServiceFlowAuth?.getCurrentUser()?.role === 'admin';
    const resolvedOption = isAdmin || complaint.status === 'resolved'
      ? `<option value="resolved" ${complaint.status === 'resolved' ? 'selected' : ''} ${isAdmin ? '' : 'disabled'}>Resolved</option>`
      : '';
    const statusControl = allowStatusChanges ? `
      <label class="mt-4 grid gap-2 text-sm text-slate-600">Update status
        <select class="complaint-status rounded-xl border border-slate-300 bg-white p-2" data-complaint-id="${escapeHtml(complaint.id)}" ${!isAdmin && complaint.status === 'resolved' ? 'disabled' : ''}>
          <option value="open" ${complaint.status === 'open' ? 'selected' : ''}>Open</option>
          <option value="escalated" ${complaint.status === 'escalated' ? 'selected' : ''}>Escalated</option>
          <option value="pending_user_confirmation" ${complaint.status === 'pending_user_confirmation' ? 'selected' : ''}>Awaiting customer confirmation</option>
          ${resolvedOption}
        </select>
      </label>` : '';
    const replyForm = complaint.status !== 'resolved' ? `
      <form class="reply-form mt-4 grid gap-3" data-complaint-id="${escapeHtml(complaint.id)}">
        <label class="grid gap-2 text-sm text-slate-600">Send a response
          <textarea class="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm" rows="2" maxlength="4000" placeholder="Write a response to the customer" required></textarea>
        </label>
        <button type="submit" class="inline-flex w-fit items-center rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500">Send reply</button>
      </form>` : '';

    return `
      <article class="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-xs uppercase tracking-[0.16em] text-slate-500">${escapeHtml(departmentName(complaint.department_id))}</p>
            <h4 class="mt-2 text-lg font-semibold text-slate-900">${escapeHtml(complaint.title)}</h4>
          </div>
          <span class="rounded-full px-3 py-1 text-xs font-semibold ${complaint.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : complaint.status === 'escalated' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}">${escapeHtml(labelStatus(complaint.status))}</span>
        </div>
        <p class="mt-3 whitespace-pre-wrap text-sm text-slate-700">${escapeHtml(complaint.description)}</p>
        <p class="mt-3 text-xs text-slate-500">Submitted by ${escapeHtml(complaint.customer?.username || 'Customer')} · ${escapeHtml(dateLabel(complaint.created_at))}</p>
        ${complaint.assigned_staff?.username ? `<p class="mt-1 text-xs text-slate-500">Assigned to ${escapeHtml(complaint.assigned_staff.username)}</p>` : ''}
        ${replies || '<p class="mt-4 text-sm text-slate-500">No response yet.</p>'}
        ${statusControl}
        ${replyForm}
      </article>`;
  }

  function renderAnnouncements(id) {
    const container = document.getElementById(id);
    if (!container) return;
    container.innerHTML = state.announcements.length ? state.announcements.map((item) => `
      <article class="rounded-3xl border border-slate-200/80 bg-slate-50 p-4 shadow-sm">
        <h4 class="font-semibold text-slate-900">${escapeHtml(item.title)}</h4>
        <p class="mt-2 whitespace-pre-wrap text-sm text-slate-700">${escapeHtml(item.message)}</p>
        <p class="mt-3 text-[11px] text-slate-500">${escapeHtml(dateLabel(item.created_at))}</p>
      </article>`).join('') : '<p class="text-sm text-slate-500">No announcements yet.</p>';
  }

  function renderStaffRoster() {
    const roster = document.getElementById('staff-list');
    if (!roster) return;
    roster.innerHTML = state.staff.length ? state.staff.map((person) => `
      <article class="rounded-3xl border border-slate-200/80 bg-white/90 p-4 shadow-sm">
        <p class="font-semibold text-slate-900">${escapeHtml(person.username || 'Department staff')}</p>
        <p class="text-sm text-slate-500">${escapeHtml(departmentName(person.department_id))}</p>
      </article>`).join('') : '<p class="text-sm text-slate-500">No staff profiles have been assigned yet.</p>';
  }

  function wireComplaintActions(container) {
    container.querySelectorAll('.reply-form').forEach((form) => {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const textarea = form.querySelector('textarea');
        const button = form.querySelector('button[type="submit"]');
        const message = textarea?.value.trim();
        if (!message) return;
        setBusy(button, true);
        try {
          await api.addReply(form.dataset.complaintId, message);
          await refresh();
          toast('Reply sent successfully.');
        } catch (error) {
          setBusy(button, false);
          toast(error.message, true);
        }
      });
    });

    container.querySelectorAll('.complaint-status').forEach((select) => {
      select.addEventListener('change', async () => {
        const previous = select.dataset.previousValue || select.value;
        select.disabled = true;
        try {
          await api.updateComplaintStatus(select.dataset.complaintId, select.value);
          await refresh();
          toast('Complaint status updated.');
        } catch (error) {
          select.value = previous;
          toast(error.message, true);
        } finally {
          select.disabled = false;
        }
      });
      select.dataset.previousValue = select.value;
    });
  }

  function renderStaffDashboard() {
    const complaints = state.complaints;
    const pending = complaints.filter((item) => item.status === 'open' || item.status === 'escalated').length;
    const open = complaints.filter((item) => item.status !== 'resolved').length;
    const count = document.getElementById('staff-online-count');
    if (count) count.textContent = String(state.staff.length);
    const pendingCount = document.getElementById('staff-pending-count');
    if (pendingCount) pendingCount.textContent = String(pending);
    const openCount = document.getElementById('staff-open-count');
    if (openCount) openCount.textContent = String(open);

    const statusPill = document.querySelector('.status-pill');
    if (statusPill) statusPill.textContent = state.staff.length ? 'Department team configured' : 'No staff profiles found';

    const container = document.getElementById('staff-complaint-list');
    if (container) {
      container.innerHTML = complaints.length
        ? complaints.map((item) => complaintCard(item, true)).join('')
        : '<p class="text-sm text-slate-500">No complaints are currently visible to your department.</p>';
      wireComplaintActions(container);
    }

    const taskList = document.getElementById('staff-task-list');
    if (taskList) {
      const active = complaints.filter((item) => item.status !== 'resolved').slice(0, 5);
      taskList.innerHTML = active.length ? active.map((item) => `
        <article class="rounded-3xl border border-slate-200/80 bg-white/90 p-4 shadow-sm">
          <p class="font-semibold text-slate-900">${escapeHtml(item.title)}</p>
          <p class="mt-1 text-sm text-slate-500">${escapeHtml(labelStatus(item.status))} · ${escapeHtml(dateLabel(item.created_at))}</p>
        </article>`).join('') : '<p class="text-sm text-slate-500">No active tasks.</p>';
    }
    renderStaffRoster();
    renderAnnouncements('staff-announcements');
  }

  function renderAdminDashboard() {
    const active = state.complaints.filter((item) => item.status !== 'resolved').length;
    const pending = state.complaints.filter((item) => item.status === 'open' || item.status === 'escalated').length;
    const values = {
      'summary-departments-count': state.departments.length,
      'summary-active-complaints-count': active,
      'summary-pending-count': pending,
      'summary-announcements-count': state.announcements.length,
    };
    Object.entries(values).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.textContent = String(value);
    });

    const complaintContainer = document.getElementById('admin-complaint-list');
    if (complaintContainer) {
      complaintContainer.innerHTML = state.complaints.length
        ? state.complaints.map((item) => complaintCard(item, true)).join('')
        : '<p class="text-sm text-slate-500">No customer complaints found.</p>';
      wireComplaintActions(complaintContainer);
    }

    const statusGrid = document.getElementById('department-status-grid');
    if (statusGrid) {
      statusGrid.innerHTML = state.departments.map((department) => {
        const deptComplaints = state.complaints.filter((item) => item.department_id === department.id && item.status !== 'resolved').length;
        const deptStaff = state.staff.filter((person) => person.department_id === department.id).length;
        return `
          <article class="rounded-3xl border border-slate-200/80 bg-white/90 p-4 shadow-sm">
            <div class="flex items-center justify-between gap-4">
              <div><p class="font-semibold text-slate-900">${escapeHtml(department.name)}</p><p class="text-sm text-slate-500">${deptStaff} assigned staff · ${deptComplaints} active request(s)</p></div>
              <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">Department</span>
            </div>
          </article>`;
      }).join('');
    }

    const taskList = document.getElementById('task-list');
    if (taskList) {
      const activeTasks = state.complaints.filter((item) => item.status !== 'resolved').slice(0, 5);
      taskList.innerHTML = activeTasks.length ? activeTasks.map((item) => `
        <article class="rounded-3xl border border-slate-200/80 bg-white/90 p-4 shadow-sm">
          <p class="font-semibold text-slate-900">${escapeHtml(item.title)}</p>
          <p class="mt-1 text-sm text-slate-500">${escapeHtml(departmentName(item.department_id))} · ${escapeHtml(labelStatus(item.status))}</p>
        </article>`).join('') : '<p class="text-sm text-slate-500">No active tasks.</p>';
    }
    renderAnnouncements('admin-announcements');
  }

  async function refresh() {
    const [complaints, announcements, departments, staff] = await Promise.all([
      api.getComplaints(), api.getAnnouncements(), api.getDepartments(), api.getStaff(),
    ]);
    state.complaints = complaints;
    state.announcements = announcements;
    state.departments = departments;
    state.staff = staff;
    const page = document.body.classList.contains('page-admin-dashboard') || document.getElementById('admin-complaint-list')
      ? 'admin' : 'staff';
    if (page === 'admin') renderAdminDashboard();
    else renderStaffDashboard();
  }

  function wireStaffActions() {
    document.querySelectorAll('.logout-button').forEach((button) => {
      button.addEventListener('click', async () => {
        setBusy(button, true, 'Signing out…');
        try { await window.ServiceFlowAuth.logout(); } catch (_error) { /* Session is cleared locally. */ }
        window.location.replace('login.html');
      });
    });
  }

  function initStaffDashboard() {
    return (async () => {
      if (!await window.ServiceFlowAuthReady) return;
      try {
        await refresh();
        wireStaffActions();
        window.setInterval(() => refresh().catch((error) => toast(error.message, true)), 60000);
      } catch (error) {
        toast(error.message || 'Unable to load the staff dashboard.', true);
      }
    })();
  }

  function initAdminDashboard() {
    return (async () => {
      if (!await window.ServiceFlowAuthReady) return;
      const announcementForm = document.getElementById('announcement-form');
      announcementForm?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const button = announcementForm.querySelector('button[type="submit"]');
        const title = document.getElementById('announcement-title')?.value.trim();
        const message = document.getElementById('announcement-body')?.value.trim();
        if (!title || !message) return;
        setBusy(button, true, 'Publishing…');
        try {
          await api.createAnnouncement({ title, message });
          announcementForm.reset();
          await refresh();
          toast('Announcement published.');
        } catch (error) {
          toast(error.message, true);
        } finally {
          setBusy(button, false);
        }
      });

      const complaintForm = document.getElementById('admin-complaint-form');
      complaintForm?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const button = complaintForm.querySelector('button[type="submit"]');
        const departmentId = document.getElementById('admin-complaint-department')?.value;
        const title = document.getElementById('admin-complaint-category')?.value.trim();
        const description = document.getElementById('admin-complaint-message')?.value.trim();
        if (!departmentId || !title || !description) return;
        setBusy(button, true, 'Submitting…');
        try {
          await api.createComplaint({ department_id: departmentId, title, description });
          complaintForm.reset();
          await refresh();
          toast('Support task created.');
        } catch (error) {
          toast(error.message, true);
        } finally {
          setBusy(button, false);
        }
      });

      const departmentInput = document.getElementById('admin-complaint-department');
      try {
        await refresh();
        if (departmentInput) {
          departmentInput.innerHTML = state.departments.map((department) =>
            `<option value="${escapeHtml(department.id)}">${escapeHtml(department.name)}</option>`
          ).join('');
        }
        wireStaffActions();
        window.setInterval(() => refresh().catch((error) => toast(error.message, true)), 60000);
      } catch (error) {
        toast(error.message || 'Unable to load the admin dashboard.', true);
      }
    })();
  }

  window.DashboardSync = { initStaffDashboard, initAdminDashboard };
})();
