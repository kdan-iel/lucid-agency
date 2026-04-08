import { z } from 'zod';

// ============================================================
// SCHÉMA CONTACT FORM
// ============================================================
export const contactFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Minimum 2 caractères')
    .max(100, 'Maximum 100 caractères')
    .regex(/^[a-zA-ZÀ-ÿ\s'\-]+$/, 'Caractères invalides'),

  company: z.string().max(100, 'Maximum 100 caractères').optional().or(z.literal('')),

  email: z.string().email('Email invalide').max(255),

  type: z.string().optional(),

  budget: z.string().optional(),

  message: z
    .string()
    .min(10, 'Minimum 10 caractères')
    .max(5000, 'Maximum 5000 caractères')
    .refine((val) => !/<[^>]*>/g.test(val), 'Le HTML nest pas autorisé'),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;

// ============================================================
// SCHÉMA INSCRIPTION FREELANCER
// ============================================================
export const joinFormSchema = z
  .object({
    firstName: z
      .string()
      .min(2, 'Minimum 2 caractères')
      .max(50, 'Maximum 50 caractères')
      .regex(/^[a-zA-ZÀ-ÿ\s'\-]+$/, 'Caractères invalides'),

    lastName: z
      .string()
      .min(2, 'Minimum 2 caractères')
      .max(50, 'Maximum 50 caractères')
      .regex(/^[a-zA-ZÀ-ÿ\s'\-]+$/, 'Caractères invalides'),

    email: z.string().email('Email invalide').max(255),

    password: z
      .string()
      .min(8, 'Minimum 8 caractères')
      .regex(/[A-Z]/, 'Au moins une majuscule')
      .regex(/[0-9]/, 'Au moins un chiffre')
      .regex(/[^a-zA-Z0-9]/, 'Au moins un caractère spécial'),

    confirmPassword: z.string(),

    specialty: z.string().min(2, 'Minimum 2 caractères').max(100, 'Maximum 100 caractères'),

    portfolio: z
      .string()
      .url('URL invalide (ex: https://monportfolio.com)')
      .optional()
      .or(z.literal('')),

    message: z
      .string()
      .max(1000, 'Maximum 1000 caractères')
      .refine((val) => !/<[^>]*>/g.test(val), 'Le HTML nest pas autorisé')
      .optional()
      .or(z.literal('')),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

export type JoinFormInput = z.infer<typeof joinFormSchema>;
