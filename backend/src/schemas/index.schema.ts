import { z } from 'zod/v4'

export const signUpSchema = z.object({
  full_name: z.string().min(2).max(100),
  email:     z.email(),
  password:  z.string().min(8),
})

export const signInSchema = z.object({
  email:    z.email(),
  password: z.string().min(1),
})

export const updateProfileSchema = z.object({
  full_name: z.string().min(2).max(100).optional(),
  phone:     z.string().max(20).optional(),
  location:  z.string().max(200).optional(),
})
