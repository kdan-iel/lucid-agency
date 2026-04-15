/**
 * Service pour envoyer les données formulaires vers Google Drive
 * (via Google Apps Script comme intermédiaire)
 */

const GOOGLE_APPS_SCRIPT_URL = import.meta.env.VITE_GAS_URL;
const SECRET_TOKEN = import.meta.env.VITE_GAS_TOKEN;

export interface FormSubmissionPayload {
  formType: "contact" | "freelancer";
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
    formType: "contact",
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
    formType: "freelancer",
    ...data,
  });
}

/**
 * Fonction générique d'envoi vers Google Apps Script
 */
async function submitToGoogleDrive(payload: FormSubmissionPayload) {
  if (!GOOGLE_APPS_SCRIPT_URL || !SECRET_TOKEN) {
    throw new Error("Configuration serveur manquante");
  }

  try {
    const fullPayload = {
      ...payload,
      token: SECRET_TOKEN,
      ipAddress: await getClientIP(),
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };

    await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify(fullPayload),
      mode: "no-cors",
    });

    return {
      success: true,
      message: "Données envoyées vers Google Drive",
    };

  } catch {
    throw new Error("Impossible de sauvegarder les données");
  }
}

/**
 * Récupère l'adresse IP du client (optionnel)
 */
async function getClientIP(): Promise<string> {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return data.ip || "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * Test manuel - à appeler depuis la console du navigateur
 */
export async function testGoogleDrive() {
  try {
    await submitContactToGoogleDrive({
      name: "Test Frontend",
      company: "Test Corp",
      email: "test@frontend.com",
      type: "Logo / Branding",
      budget: "50 000 a 100 000 FCFA",
      budgetDetails: "",
      message: "Message de test depuis le frontend",
    });

    return true;
  } catch {
    return false;
  }
}
