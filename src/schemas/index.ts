import { z } from 'zod';

export const freelancerSpecialties = [
  'graphisme',
  'video',
  'redaction',
  'webdev',
  'photo',
  'marketing',
  'autre',
] as const;

export type FreelancerSpecialty = (typeof freelancerSpecialties)[number];

// ============================================================
// SCHEMA CONTACT FORM
// ============================================================
export const contactFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Minimum 2 caracteres')
    .max(100, 'Maximum 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s'\-]+$/, 'Caracteres invalides'),

  company: z.string().max(100, 'Maximum 100 caracteres').optional().or(z.literal('')),

  email: z.string().email('Email invalide').max(255),

  type: z.string().optional(),

  budget: z.string().optional(),

  message: z
    .string()
    .min(10, 'Minimum 10 caracteres')
    .max(5000, 'Maximum 5000 caracteres')
    .refine((val) => !/<[^>]*>/g.test(val), 'Le HTML nest pas autorise'),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;

// ============================================================
// SCHEMA INSCRIPTION FREELANCER
// ============================================================
export const joinFormSchema = z
  .object({
    firstName: z
      .string()
      .min(2, 'Minimum 2 caracteres')
      .max(50, 'Maximum 50 caracteres')
      .regex(/^[a-zA-ZÀ-ÿ\s'\-]+$/, 'Caracteres invalides'),

    lastName: z
      .string()
      .min(2, 'Minimum 2 caracteres')
      .max(50, 'Maximum 50 caracteres')
      .regex(/^[a-zA-ZÀ-ÿ\s'\-]+$/, 'Caracteres invalides'),

    email: z.string().email('Email invalide').max(255),

    password: z
      .string()
      .min(8, 'Minimum 8 caracteres')
      .regex(/[A-Z]/, 'Au moins une majuscule')
      .regex(/[0-9]/, 'Au moins un chiffre')
      .regex(/[^a-zA-Z0-9]/, 'Au moins un caractere special'),

    confirmPassword: z.string(),

    specialty: z
      .string()
      .min(1, 'Veuillez choisir une specialite')
      .refine(
        (value) => freelancerSpecialties.includes(value as FreelancerSpecialty),
        'Specialite invalide'
      ),

    portfolio: z
      .string()
      .url('URL invalide (ex: https://monportfolio.com)')
      .optional()
      .or(z.literal('')),

    message: z
      .string()
      .max(1000, 'Maximum 1000 caracteres')
      .refine((val) => !/<[^>]*>/g.test(val), 'Le HTML nest pas autorise')
      .optional()
      .or(z.literal('')),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

export type JoinFormInput = z.infer<typeof joinFormSchema>;
