import type { Response } from 'express';
import { number, z } from 'zod';
import type { AuthenticatedRequest } from '../types/index.type.js';
import { HttpError } from '../middleware/index.middleware.js';
import {
  signUpSchema,
  signInSchema,
  complaintSchema,
  statusSchema,
  replySchema,
  announcementSchema,
} from '../schemas/index.schema.js';
import {
  AuthService,
  DepartmentService,
  StaffService,
  ComplaintService,
  AnnouncementService,
} from '../services/index.service.js';

function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    const message = result.error.issues.map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`).join('; ');
    throw new HttpError(400, message);
  }
  return result.data;
}

function auth(req: AuthenticatedRequest) {
  if (!req.auth) throw new HttpError(401, 'Sign in to continue.');
  return req.auth;
}

export const signUpUser = async (req: AuthenticatedRequest, res: Response) => {
  const input = parseBody(signUpSchema, req.body);
  const data = await AuthService.signUp(input.full_name, input.email, input.password);
  res.status(201).json({
    message: data.session ? 'Account created successfully.' : 'Account created. Check your email to confirm it before signing in.',
    user: data.user,
    session: data.session,
    requiresEmailConfirmation: !data.session,
  });
};

export const signInUser = async (req: AuthenticatedRequest, res: Response) => {
  const input = parseBody(signInSchema, req.body);
  const data = await AuthService.signIn(input.email, input.password);
  res.status(200).json({
    message: 'Signed in successfully.',
    user: data.user,
    session: data.session,
  });
};

export const getCurrentUser = async (req: AuthenticatedRequest, res: Response) => {
  const current = auth(req);
  const profile = await AuthService.getProfile(current.accessToken, current.userId);
  res.json({ user: { ...profile, email: current.email } });
};

export const fetchDepartments = async (req: AuthenticatedRequest, res: Response) => {
  res.json({ data: await DepartmentService.getAll(auth(req).accessToken) });
};

export const fetchStaff = async (req: AuthenticatedRequest, res: Response) => {
  const current = auth(req);
  const requestedDepartment = typeof req.query.department_id === 'string' ? req.query.department_id : null;

  if (current.role === 'dept_member' && !current.departmentId) {
    res.json({ data: [] });
    return;
  }
  const departmentId = current.role === 'dept_member' ? current.departmentId : requestedDepartment;
  res.json({ data: await StaffService.getAll(current.accessToken, departmentId) });
};

export const submitComplaint = async (req: AuthenticatedRequest, res: Response) => {
  const current = auth(req);
  const input = parseBody(complaintSchema, req.body);
  const data = await ComplaintService.create(current.accessToken, current.userId, current.role, input);
  res.status(201).json({ data });
};

export const fetchComplaints = async (req: AuthenticatedRequest, res: Response) => {
  const current = auth(req);
  res.json({ data: await ComplaintService.getAll(current.accessToken) });
};

export const changeStatus = async (req: AuthenticatedRequest, res: Response) => {
  const current = auth(req);
  const input = parseBody(statusSchema, req.body);
  const data = await ComplaintService.updateStatus(current.accessToken, String(req.params.id), input.status);
  res.json({ data });
};

export const submitReply = async (req: AuthenticatedRequest, res: Response) => {
  const current = auth(req);
  const input = parseBody(replySchema, req.body);
  const data = await ComplaintService.addReply(
    current.accessToken,
    current.userId,
    String(req.params.id),
    input.message,
  );
  res.status(201).json({ data });
};

export const fetchAnnouncements = async (req: AuthenticatedRequest, res: Response) => {
  res.json({ data: await AnnouncementService.getAll(auth(req).accessToken) });
};

export const publishAnnouncement = async (req: AuthenticatedRequest, res: Response) => {
  const current = auth(req);
  const input = parseBody(announcementSchema, req.body);
  const data = await AnnouncementService.create(current.accessToken, current.userId, input.title, input.message);
  res.status(201).json({ data });
};
