export type UserRole = 'customer' | 'dept_member' | 'admin';
export type TicketStatus = 'open' | 'escalated' | 'pending_user_confirmation' | 'resolved';

export interface ComplaintData {
  department_id: string;
  title: string;
  description: string;
}

export interface ReplyData {
  complaint_id: string;
  message: string;
}