import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/index.middleware.js';
import {
  signUpUser,
  signInUser,
  getCurrentUser,
  fetchDepartments,
  fetchStaff,
  submitComplaint,
  fetchComplaints,
  changeStatus,
  submitReply,
  fetchAnnouncements,
  publishAnnouncement,
} from '../controllers/index.controller.js';

const router = Router();

router.post('/auth/signup', signUpUser);
router.post('/auth/signin', signInUser);

router.use(requireAuth);
router.get('/auth/me', getCurrentUser);

router.get('/departments', fetchDepartments);
router.get('/staff', fetchStaff);
router.get('/complaints', fetchComplaints);
router.post('/complaints', submitComplaint);
router.patch('/complaints/:id/status', changeStatus);
router.post('/complaints/:id/replies', submitReply);
router.get('/announcements', fetchAnnouncements);
router.post('/announcements', requireRole('admin'), publishAnnouncement);

export default router;
