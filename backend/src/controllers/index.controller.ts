import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/index.middleware.js';
import { AuthService, ComplaintService } from '../services/index.service.js';


export const signUpUser = async (req: Request, res: Response) => {
  try {
    const { email, password, username } = req.body;
    const data = await AuthService.signUp(email, password, username);
    res.status(201).json({ message: 'User created successfully', data });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const signInUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const session = await AuthService.signIn(email, password);
    res.status(200).json({ 
      message: 'Logged in successfully', 
      token: session?.access_token 
    });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
};

export const signOutUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await AuthService.signOut(req.accessToken!);
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const submitComplaint = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { customerId, departmentId, title, description } = req.body;
    
    const complaint = await ComplaintService.createComplaint(req.accessToken!, {
      department_id: departmentId,
      title,
      description
    }, customerId);

    res.status(201).json({ data: complaint });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const fetchComplaints = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const complaints = await ComplaintService.getComplaints(req.accessToken!);
    res.status(200).json({ data: complaints });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const changeStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const updated = await ComplaintService.updateStatus(req.accessToken!, String(id), status);
    res.status(200).json({ data: updated });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};