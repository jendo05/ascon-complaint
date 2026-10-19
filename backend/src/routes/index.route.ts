import { Router } from 'express';
import { requireAuth } from '../middleware/index.middleware.js';
import { 
    signUpUser, signInUser, signOutUser,
    submitComplaint, fetchComplaints, changeStatus 
} from '../controllers/index.controller.js';

const router = Router();

router.post('/auth/signup', signUpUser);
router.post('/auth/signin', signInUser);

router.use(requireAuth);

router.post('/complaints', submitComplaint);
router.get('/complaints', fetchComplaints);
router.patch('/complaints/:id/status', changeStatus);

router.post('/auth/signout', signOutUser);

export default router;