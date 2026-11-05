import type { Request } from 'express';

export type UserRole = 'customer' | 'dept_member' | 'admin';
export type TicketStatus = 'open' | 'escalated' | 'pending_user_confirmation' | 'resolved';

export interface AuthContext {
  accessToken: string;
  userId: string;
  email: string | undefined;
  role: UserRole;
  departmentId: string | null;
  username: string | null;
}

export interface AuthenticatedRequest extends Request {
  auth?: AuthContext;
}

export interface ComplaintInput {
  department_id: string;
  title: string;
  description: string;
  assigned_to?: string | null;
}
