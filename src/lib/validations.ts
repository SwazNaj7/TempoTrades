// Zod validation schemas based on security-checklist.md
import { z } from 'zod';

export const tradeSchema = z.object({
  instrument: z.string().min(1, 'Instrument is required').max(80),
  timeframe: z.enum(['1m', '5m', '15m', '1h', '4h', 'D', 'W', 'M']),
  direction: z.enum(['long', 'short']),
  result: z.enum(['break_even', 'take_profit', 'stopped_out']),
  open_time: z.string().datetime(),
  close_time: z.string().datetime(),
  notes: z.string().max(5000).optional(),
});

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type TradeFormValues = z.infer<typeof tradeSchema>;
export type SignupFormValues = z.infer<typeof signupSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
