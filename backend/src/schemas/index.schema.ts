import { z } from 'zod';

export const signUpSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
});

export const signInSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});

export const complaintSchema = z.object({
  department_id: z.uuid(),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(5).max(5000),
  assigned_to: z.uuid().nullable().optional(),
});

export const statusSchema = z.object({
  status: z.enum(['open', 'escalated', 'pending_user_confirmation', 'resolved']),
});

export const replySchema = z.object({
  message: z.string().trim().min(1).max(4000),
});

export const announcementSchema = z.object({
  title: z.string().trim().min(2).max(120),
  message: z.string().trim().min(2).max(5000),
});
