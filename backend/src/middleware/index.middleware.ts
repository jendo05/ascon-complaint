import type { Response, NextFunction } from 'express';
import { getSupabaseClient } from '../config/supabase.js';
import type { AuthenticatedRequest, UserRole } from '../types/index.type.js';

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export const requireAuth = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const authorization = req.header('authorization') ?? '';
    const match = authorization.match(/^Bearer\s+(.+)$/i);
    if (!match?.[1]) throw new HttpError(401, 'Sign in to continue.');

    const accessToken = match[1].trim();
    const supabase = getSupabaseClient(accessToken);
    const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !authData.user) throw new HttpError(401, 'Your session is invalid or has expired.');

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, department_id, username')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (profileError) throw new HttpError(500, 'Unable to load your account profile.');
    if (!profile) throw new HttpError(403, 'Your account profile has not been created. Contact an administrator.');

    const role = profile.role as UserRole;
    if (!['customer', 'dept_member', 'admin'].includes(role)) {
      throw new HttpError(403, 'Your account has an unsupported role.');
    }

    req.auth = {
      accessToken,
      userId: authData.user.id,
      email: authData.user.email,
      role,
      departmentId: profile.department_id,
      username: profile.username,
    };
    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (...roles: UserRole[]) =>
  (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      next(new HttpError(403, 'You do not have permission to perform this action.'));
      return;
    }
    next();
  };
