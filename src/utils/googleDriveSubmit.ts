/**
 * Service pour envoyer les données formulaires vers Google Drive
 * (via Google Apps Script comme intermédiaire)
 */

import { ensureSerializablePayload, runWithAsyncGuard, toErrorMessage } from './asyncTools';
import { getOptionalEnv, getOptionalHttpUrlEnv } from './env';

const GOOGLE_APPS_SCRIPT_URL = getOptionalHttpUrlEnv('VITE_GAS_URL');
const SECRET_TOKEN = getOptionalEnv('VITE_GAS_TOKEN', '');

export interface FormSubmissionPayload {
  formType: 'contact' | 'freelancer';
  [key: string]: any;
}

/**
 * Envoie les données du formulaire contact vers Google Drive
 */
export async function submitContactToGoogleDrive(data: {
  name: string;
  company?: string;
  email: string;
  type: string;
  budget: string;
  budgetDetails?: string;
  message: string;
}) {
  return submitToGoogleDrive({
    formType: 'contact',
    ...data,
  });
}

/**
 * Envoie les données d'inscription freelancer vers Google Drive
 */
export async function submitFreelancerToGoogleDrive(data: {
  firstName: string;
  lastName: string;
  email: string;
  specialty: string;
  portfolio?: string;
  message?: string;
}) {
  return submitToGoogleDrive({
    formType: 'freelancer',
    ...data,
  });
}

/**
 * Fonction générique d'envoi vers Google Apps Script
 */
async function submitToGoogleDrive(payload: FormSubmissionPayload) {
  if (!GOOGLE_APPS_SCRIPT_URL || !SECRET_TOKEN) {
    throw new Error('Configuration Google Drive manquante.');
  }

  try {
    const fullPayload = ensureSerializablePayload(
      {
        ...payload,
        token: SECRET_TOKEN,
        ipAddress: await getClientIP(),
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      },
      'google-drive-submit'
    );

    await runWithAsyncGuard(
      'googleDrive.submit',
      async () => {
        await fetch(GOOGLE_APPS_SCRIPT_URL, {
          method: 'POST',
          body: JSON.stringify(fullPayload),
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      },
      {
        fallbackMessage: "L'envoi Google Drive a expiré.",
        metadata: { formType: payload.formType },
      }
    );

    return {
      success: true,
      message: 'Données envoyées vers Google Drive',
    };
  } catch (error) {
    const message = toErrorMessage(error, 'Impossible de sauvegarder les données');
    console.error('[GoogleDrive] submit failure', {
      formType: payload.formType,
      message,
    });
    throw new Error(message);
  }
}

/**
 * Récupère l'adresse IP du client (optionnel)
 */
async function getClientIP(): Promise<string> {
  try {
    const response = await runWithAsyncGuard(
      'googleDrive.getClientIp',
      () => fetch('https://api.ipify.org?format=json'),
      {
        fallbackMessage: "Impossible de récupérer l'adresse IP client.",
      }
    );
    const data = await response.json();
    return data.ip || 'unknown';
  } catch (error) {
    console.warn('[GoogleDrive] client IP unavailable', {
      message: toErrorMessage(error),
    });
    return 'unknown';
  }
}

/**
 * Test manuel - à appeler depuis la console du navigateur
 */
export async function testGoogleDrive() {
  try {
    await submitContactToGoogleDrive({
      name: 'Test Frontend',
      company: 'Test Corp',
      email: 'test@frontend.com',
      type: 'Logo / Branding',
      budget: '50 000 a 100 000 FCFA',
      budgetDetails: '',
      message: 'Message de test depuis le frontend',
    });

    return true;
  } catch (error) {
    console.error('[GoogleDrive] test failure', {
      message: toErrorMessage(error),
    });
    return false;
  }
}
