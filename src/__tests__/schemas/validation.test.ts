import { describe, expect, it } from 'vitest';
import { contactFormSchema, joinFormSchema } from '../../schemas/index';

describe('contactFormSchema', () => {
  const valid = {
    name: 'Jean Dupont',
    email: 'jean@example.com',
    phone: '+228 90 00 00 00',
    message: 'Bonjour, je veux lancer un projet.',
    company: 'TechFlow',
    type: 'Site Web',
    budget: '100 000 a 200 000 FCFA',
    budgetDetails: '',
  };

  it('valide un formulaire correct', () => {
    expect(contactFormSchema.safeParse(valid).success).toBe(true);
  });

  it('rejette un nom trop court', () => {
    const r = contactFormSchema.safeParse({ ...valid, name: 'A' });
    expect(r.success).toBe(false);
  });

  it('rejette un email invalide', () => {
    const r = contactFormSchema.safeParse({ ...valid, email: 'pas-un-email' });
    expect(r.success).toBe(false);
  });

  it('rejette un message trop court', () => {
    const r = contactFormSchema.safeParse({ ...valid, message: 'Court' });
    expect(r.success).toBe(false);
  });

  it('rejette le HTML dans le message', () => {
    const r = contactFormSchema.safeParse({
      ...valid,
      message: '<script>alert(1)</script> injected content here',
    });
    expect(r.success).toBe(false);
  });

  it('rejette un message trop long', () => {
    const r = contactFormSchema.safeParse({ ...valid, message: 'a'.repeat(5001) });
    expect(r.success).toBe(false);
  });

  it('accepte un champ company vide (optionnel)', () => {
    const r = contactFormSchema.safeParse({ ...valid, company: '' });
    expect(r.success).toBe(true);
  });

  it('accepte un budget precise quand le client choisit plus de 500 000 FCFA', () => {
    const r = contactFormSchema.safeParse({
      ...valid,
      budget: 'Plus de 500 000 FCFA',
      budgetDetails: '750 000 FCFA',
    });
    expect(r.success).toBe(true);
  });

  it('rejette plus de 500 000 FCFA sans precision', () => {
    const r = contactFormSchema.safeParse({
      ...valid,
      budget: 'Plus de 500 000 FCFA',
      budgetDetails: '',
    });
    expect(r.success).toBe(false);
  });
});

describe('joinFormSchema', () => {
  const valid = {
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean@example.com',
    password: 'Secure1!Pass',
    confirmPassword: 'Secure1!Pass',
    phoneNumber: '+221770000000',
    tarifJour: 25000,
    specialty: 'graphisme',
    portfolio: 'https://jean.design',
    message: '',
  };

  it('valide une inscription correcte', () => {
    expect(joinFormSchema.safeParse(valid).success).toBe(true);
  });

  it('rejette si passwords ne correspondent pas', () => {
    const r = joinFormSchema.safeParse({ ...valid, confirmPassword: 'Different1!' });
    expect(r.success).toBe(false);
    if (!r.success) {
      const paths = r.error.issues.map((e) => e.path[0]);
      expect(paths).toContain('confirmPassword');
    }
  });

  it('rejette un mot de passe faible', () => {
    const r = joinFormSchema.safeParse({ ...valid, password: 'weak', confirmPassword: 'weak' });
    expect(r.success).toBe(false);
  });

  it('rejette un email invalide', () => {
    const r = joinFormSchema.safeParse({ ...valid, email: 'invalid' });
    expect(r.success).toBe(false);
  });

  it('rejette un portfolio non-URL', () => {
    const r = joinFormSchema.safeParse({ ...valid, portfolio: 'pas-une-url' });
    expect(r.success).toBe(false);
  });

  it('rejette une specialite hors liste', () => {
    const r = joinFormSchema.safeParse({ ...valid, specialty: 'designer' });
    expect(r.success).toBe(false);
  });

  it('rejette un numero de telephone invalide', () => {
    const r = joinFormSchema.safeParse({ ...valid, phoneNumber: '1234' });
    expect(r.success).toBe(false);
  });

  it('rejette un tarif journalier hors limite', () => {
    const r = joinFormSchema.safeParse({ ...valid, tarifJour: 500 });
    expect(r.success).toBe(false);
  });

  it('accepte un portfolio vide (optionnel)', () => {
    const r = joinFormSchema.safeParse({ ...valid, portfolio: '' });
    expect(r.success).toBe(true);
  });

  it('rejette des caracteres HTML dans le message', () => {
    const r = joinFormSchema.safeParse({ ...valid, message: '<script>xss</script>' });
    expect(r.success).toBe(false);
  });
});
