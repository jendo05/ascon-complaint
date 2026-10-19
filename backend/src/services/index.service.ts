import { getSupabaseClient } from '../config/supabase.js';
import type { ComplaintData, TicketStatus } from '../types/index.type.js';
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

const authClient = createClient(env.supabaseUrl, env.supabaseKey, {
  auth: { persistSession: false }
});

export class AuthService {
  static async signUp(email: string, password: string, username: string) {
    const { data, error } = await authClient.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });
    if (error) throw new Error(error.message);
    return data;
  }

  static async signIn(email: string, password: string) {
    const { data, error } = await authClient.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error(error.message);
    return data.session;
  }

  static async signOut(token: string) {
    const supabase = getSupabaseClient(token); 
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
    return { success: true };
  }
}

export class ComplaintService {
  static async createComplaint(token: string, data: ComplaintData, customerId: string) {
    const supabase = getSupabaseClient(token);
    const { data: complaint, error } = await supabase
      .from('complaints')
      .insert([{ ...data, customer_id: customerId }])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return complaint;
  }

  static async getComplaints(token: string) {
    const supabase = getSupabaseClient(token);
    const { data: complaints, error } = await supabase
      .from('complaints')
      .select('*, departments(name), profiles(username)');

    if (error) throw new Error(error.message);
    return complaints;
  }

  static async updateStatus(token: string, complaintId: string, status: TicketStatus) {
    const supabase = getSupabaseClient(token);
    const { data: updated, error } = await supabase
      .from('complaints')
      .update({ status })
      .eq('id', complaintId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return updated;
  }
}