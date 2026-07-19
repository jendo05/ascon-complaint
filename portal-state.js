(function () {
  const STORAGE_KEY = 'serviceflow-portal-state';
  const DEFAULT_STATE = {
    complaints: [],
    announcements: [],
    lastUpdated: Date.now(),
  };

  function getState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : { ...DEFAULT_STATE };
    } catch (error) {
      console.warn('Unable to read portal state', error);
      return { ...DEFAULT_STATE };
    }
  }

  function saveState(state) {
    const next = {
      ...DEFAULT_STATE,
      ...state,
      complaints: state.complaints || [],
      announcements: state.announcements || [],
      lastUpdated: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  }

  function updateState(updater) {
    const current = getState();
    const next = updater({ ...current }) || current;
    return saveState(next);
  }

  function addAnnouncement(title, message) {
    return updateState((state) => {
      state.announcements = [
        {
          id: `announcement-${Date.now()}`,
          title,
          message,
          createdAt: new Date().toLocaleString(),
        },
        ...(state.announcements || []),
      ];
      return state;
    });
  }

  function addComplaint({ departmentId, category, message, staffId, author = 'Customer' }) {
    return updateState((state) => {
      const complaint = {
        id: `cmp-${Date.now()}`,
        departmentId,
        category,
        message,
        staffId: staffId || null,
        author,
        createdAt: new Date().toLocaleString(),
        status: 'Pending',
        replies: [],
      };
      state.complaints = [complaint, ...(state.complaints || [])];
      return state;
    });
  }

  function addReply(complaintId, { responder, message, role = 'Staff', status = 'Responded' }) {
    return updateState((state) => {
      const complaint = (state.complaints || []).find((item) => item.id === complaintId);
      if (!complaint) return state;
      complaint.replies = [
        ...(complaint.replies || []),
        {
          id: `reply-${Date.now()}`,
          responder,
          role,
          message,
          createdAt: new Date().toLocaleString(),
        },
      ];
      complaint.status = status;
      return state;
    });
  }

  window.PortalState = {
    getState,
    saveState,
    updateState,
    addAnnouncement,
    addComplaint,
    addReply,
    STORAGE_KEY,
  };
})();
