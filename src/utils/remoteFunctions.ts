import { supabase } from '../lib/supabaseClient';

const CONTACT_FUNCTION_NAME = import.meta.env.VITE_CONTACT_FUNCTION_NAME || 'contact-submit';
const JOIN_FUNCTION_NAME = import.meta.env.VITE_JOIN_FUNCTION_NAME || 'join-submit';
const PROFILE_GET_FUNCTION_NAME =
  import.meta.env.VITE_PROFILE_GET_FUNCTION_NAME || 'profile-get-by-user-id';
const PROFILE_UPDATE_FUNCTION_NAME =
  import.meta.env.VITE_PROFILE_UPDATE_FUNCTION_NAME || 'profile-update';
const FREELANCER_UPDATE_FUNCTION_NAME =
  import.meta.env.VITE_FREELANCER_UPDATE_FUNCTION_NAME || 'freelancer-update';
const PUBLIC_TALENTS_FUNCTION_NAME =
  import.meta.env.VITE_PUBLIC_TALENTS_FUNCTION_NAME || 'public-talents-list';
const ADMIN_TALENT_REQUESTS_FUNCTION_NAME =
  import.meta.env.VITE_ADMIN_TALENT_REQUESTS_FUNCTION_NAME || 'admin-talent-requests-list';
const ADMIN_TALENT_STATUS_FUNCTION_NAME =
  import.meta.env.VITE_ADMIN_TALENT_STATUS_FUNCTION_NAME || 'admin-talent-status-update';

type FunctionResponse = {
  error?: string;
  message?: string;
};

export interface RemoteProfile {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'freelancer' | 'client';
  avatar_url?: string;
  bio?: string;
  phone?: string;
  tarif_jour?: number;
  onboarding_completed?: boolean;
  created_at: string;
  updated_at: string;
}

export interface PublicTalentRecord {
  id: string;
  user_id: string;
  specialty: string;
  skills?: string[] | null;
  rate_per_hour?: number | null;
  bio?: string | null;
  portfolio_url?: string | null;
  first_name?: string | null;
  last_name?: string | null;
}

export interface AdminTalentRequestRecord {
  id: string;
  user_id: string;
  specialty: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  portfolio_url?: string | null;
  email?: string | null;
  phone?: string | null;
  phone_number?: string | null;
  tarif_jour?: number | null;
  onboarding_completed?: boolean | null;
  first_name?: string | null;
  last_name?: string | null;
}

async function extractFunctionError(error: {
  message: string;
  context?: Response | undefined;
}): Promise<string> {
  if (error.context instanceof Response) {
    try {
      const payload = (await error.context.clone().json()) as FunctionResponse;
      if (payload.error) return payload.error;
      if (payload.message) return payload.message;
    } catch {
      try {
        const text = await error.context.clone().text();
        if (text) return text;
      } catch {
        // Ignore secondary parsing failures and use the fallback below.
      }
    }
  }

  return error.message || 'Erreur serveur';
}

async function invokeRemoteFunction<
  TResult,
  TPayload extends Record<string, unknown> = Record<string, unknown>,
>(functionName: string, payload?: TPayload): Promise<TResult> {
  const { data, error } = await supabase.functions.invoke(functionName, {
    body: payload ?? {},
  });

  if (error) {
    throw new Error(await extractFunctionError(error));
  }

  if (data && typeof data === 'object') {
    const response = data as FunctionResponse;
    if (response.error) {
      throw new Error(response.error);
    }
  }

  return data as TResult;
}

export async function submitContact(payload: {
  name: string;
  company: string;
  email: string;
  phone: string;
  type: string;
  budget: string;
  budgetDetails: string;
  message: string;
}) {
  return invokeRemoteFunction(CONTACT_FUNCTION_NAME, payload);
}

export async function submitJoinApplication(payload: {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  specialty: string;
  portfolioUrl: string | null;
  bio: string | null;
  role: 'freelancer';
  status: 'pending';
}) {
  return invokeRemoteFunction(JOIN_FUNCTION_NAME, payload);
}

export async function fetchProfileByUserId(userId: string) {
  return invokeRemoteFunction<RemoteProfile | null>(PROFILE_GET_FUNCTION_NAME, { userId });
}

export async function updateProfileRecord(userId: string, updates: Partial<RemoteProfile>) {
  return invokeRemoteFunction<RemoteProfile>(PROFILE_UPDATE_FUNCTION_NAME, { userId, updates });
}

export async function updateFreelancerRecordByUserId(
  userId: string,
  updates: Record<string, unknown>
) {
  return invokeRemoteFunction(FREELANCER_UPDATE_FUNCTION_NAME, { userId, updates });
}

export async function listPublicTalents() {
  const data = await invokeRemoteFunction<PublicTalentRecord[]>(PUBLIC_TALENTS_FUNCTION_NAME);
  return Array.isArray(data) ? data : [];
}

export async function listAdminTalentRequests() {
  const data = await invokeRemoteFunction<AdminTalentRequestRecord[]>(
    ADMIN_TALENT_REQUESTS_FUNCTION_NAME
  );
  return Array.isArray(data) ? data : [];
}

export async function updateAdminTalentStatus(id: string, status: 'approved' | 'rejected') {
  return invokeRemoteFunction(ADMIN_TALENT_STATUS_FUNCTION_NAME, { id, status });
}
