import { authClient, getSupabaseClient } from '../config/supabase.js';
import { HttpError } from '../middleware/index.middleware.js';
import type { ComplaintInput, TicketStatus, UserRole } from '../types/index.type.js';

function throwSupabaseError(error: { message: string; code?: string } | null, fallback: string): void {
  if (!error) return;
  const message = error.code === 'PGRST116' ? 'The requested record was not found.' : error.message;
  throw new HttpError(400, message || fallback);
}

export class AuthService {
  static async signUp(fullName: string, email: string, password: string) {
    const { data, error } = await authClient.auth.signUp({
      email,
      password,
      options: { data: { username: fullName } },
    });
    throwSupabaseError(error, 'Unable to create the account.');
    return data;
  }

  static async signIn(email: string, password: string) {
    const { data, error } = await authClient.auth.signInWithPassword({ email, password });
    throwSupabaseError(error, 'Unable to sign in.');
    if (!data.session || !data.user) throw new HttpError(401, 'Sign-in did not return an active session.');
    return data;
  }

  static async getProfile(token: string, userId: string) {
    const supabase = getSupabaseClient(token);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, role, department_id')
      .eq('id', userId)
      .single();
    throwSupabaseError(error, 'Unable to load the account profile.');
    return data;
  }
}

export class DepartmentService {
  static async getAll(token: string) {
    const { data, error } = await getSupabaseClient(token)
      .from('departments')
      .select('id, name, description')
      .order('name', { ascending: true });
    throwSupabaseError(error, 'Unable to load departments.');
    return data ?? [];
  }
}

export class StaffService {
  static async getAll(token: string, departmentId?: string | null) {
    let query = getSupabaseClient(token)
      .from('profiles')
      .select('id, username, department_id')
      .eq('role', 'dept_member')
      .order('username', { ascending: true });
    if (departmentId) query = query.eq('department_id', departmentId);
    const { data, error } = await query;
    throwSupabaseError(error, 'Unable to load staff members.');
    return data ?? [];
  }
}

export class ComplaintService {
  static async create(token: string, userId: string, role: UserRole, input: ComplaintInput) {
    const supabase = getSupabaseClient(token);
    if (input.assigned_to) {
      const { data: assignee, error: assigneeError } = await supabase
        .from('profiles')
        .select('id, department_id, role')
        .eq('id', input.assigned_to)
        .maybeSingle();
      throwSupabaseError(assigneeError, 'Unable to verify the selected staff member.');
      if (!assignee || assignee.role !== 'dept_member' || assignee.department_id !== input.department_id) {
        throw new HttpError(400, 'Choose a staff member assigned to the selected department.');
      }
    }

    if (role === 'dept_member') {
      throw new HttpError(403, 'Department members cannot submit customer complaints.');
    }

    const { data, error } = await supabase
      .from('complaints')
      .insert({
        customer_id: userId,
        department_id: input.department_id,
        title: input.title,
        description: input.description,
        assigned_to: input.assigned_to ?? null,
      })
      .select('id, customer_id, department_id, title, description, status, assigned_to, created_at')
      .single();
    throwSupabaseError(error, 'Unable to submit the complaint.');
    return data;
  }

  static async getAll(token: string) {
    const { data, error } = await getSupabaseClient(token)
      .from('complaints')
      .select('id, customer_id, department_id, title, description, status, assigned_to, created_at, departments(name), customer:profiles!complaints_customer_id_fkey(username), assigned_staff:profiles!complaints_assigned_to_fkey(username), replies(id, sender_id, message, created_at, sender:profiles!replies_sender_id_fkey(username))')
      .order('created_at', { ascending: false });
    throwSupabaseError(error, 'Unable to load complaints.');
    return data ?? [];
  }

  static async updateStatus(token: string, complaintId: string, status: TicketStatus) {
    const { data, error } = await getSupabaseClient(token)
      .from('complaints')
      .update({ status })
      .eq('id', complaintId)
      .select('id, status, updated_at')
      .single();
    throwSupabaseError(error, 'Unable to update the complaint status.');
    return data;
  }

  static async addReply(token: string, userId: string, complaintId: string, message: string) {
    const { data, error } = await getSupabaseClient(token)
      .from('replies')
      .insert({ complaint_id: complaintId, sender_id: userId, message })
      .select('id, complaint_id, sender_id, message, created_at')
      .single();
    throwSupabaseError(error, 'Unable to send your reply.');
    return data;
  }
}

export class AnnouncementService {
  static async getAll(token: string) {
    const { data, error } = await getSupabaseClient(token)
      .from('announcements')
      .select('id, title, message, created_at')
      .order('created_at', { ascending: false })
      .limit(50);
    throwSupabaseError(error, 'Unable to load announcements.');
    return data ?? [];
  }

  static async create(token: string, userId: string, title: string, message: string) {
    const { data, error } = await getSupabaseClient(token)
      .from('announcements')
      .insert({ created_by: userId, title, message })
      .select('id, title, message, created_at')
      .single();
    throwSupabaseError(error, 'Unable to publish the announcement.');
    return data;
  }
}
