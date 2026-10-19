import type { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  accessToken?: string;
}

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization token' });
  }

  const token = authHeader.split(' ')[1];
  req.accessToken = token;
  
  next();
};