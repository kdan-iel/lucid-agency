import { supabase } from '../lib/supabaseClient';
import { ensureSerializablePayload, runWithAsyncGuard } from './asyncTools';
import { getOptionalEnv } from './env';

const CONTACT_FUNCTION_NAME = getOptionalEnv('VITE_CONTACT_FUNCTION_NAME', 'contact-submit');
const JOIN_FUNCTION_NAME = getOptionalEnv('VITE_JOIN_FUNCTION_NAME', 'join-submit');
const PROFILE_GET_FUNCTION_NAME = getOptionalEnv(
  'VITE_PROFILE_GET_FUNCTION_NAME',
  'profile-get-by-user-id'
);
const PROFILE_UPDATE_FUNCTION_NAME = getOptionalEnv(
  'VITE_PROFILE_UPDATE_FUNCTION_NAME',
  'profile-update'
);
const FREELANCER_UPDATE_FUNCTION_NAME = getOptionalEnv(
  'VITE_FREELANCER_UPDATE_FUNCTION_NAME',
  'freelancer-update'
);
const PUBLIC_TALENTS_FUNCTION_NAME = getOptionalEnv(
  'VITE_PUBLIC_TALENTS_FUNCTION_NAME',
  'public-talents-list'
);
const ADMIN_TALENT_REQUESTS_FUNCTION_NAME = getOptionalEnv(
  'VITE_ADMIN_TALENT_REQUESTS_FUNCTION_NAME',
  'admin-talent-requests-list'
);
const ADMIN_TALENT_STATUS_FUNCTION_NAME = getOptionalEnv(
  'VITE_ADMIN_TALENT_STATUS_FUNCTION_NAME',
  'admin-talent-status-update'
);
const COMPLETE_PROFILE_FUNCTION_NAME = getOptionalEnv(
  'VITE_COMPLETE_PROFILE_FUNCTION_NAME',
  'complete-profile'
);

type FunctionResponse = {
  error?: string;
  message?: string;
};

interface RemoteInvokeOptions<TPayload extends Record<string, unknown> | undefined> {
  payload?: TPayload;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

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
>(functionName: string, options: RemoteInvokeOptions<TPayload> = {}): Promise<TResult> {
  const payload = ensureSerializablePayload(
    options.payload ?? ({} as TPayload),
    `remote:${functionName}`
  );

  return runWithAsyncGuard(
    `edge:${functionName}`,
    async () => {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload,
        ...(options.headers ? { headers: options.headers } : {}),
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
    },
    {
      fallbackMessage: `Le service distant "${functionName}" ne répond pas.`,
      metadata: {
        functionName,
      },
      ...(typeof options.timeoutMs === 'number' ? { timeoutMs: options.timeoutMs } : {}),
    }
  );
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
  return invokeRemoteFunction(CONTACT_FUNCTION_NAME, { payload });
}

export async function submitJoinApplication(payload: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  tarifJour: number;
  specialty: string;
  portfolioUrl: string;
  message: string;
}) {
  return invokeRemoteFunction(JOIN_FUNCTION_NAME, {
    payload: {
      first_name: payload.firstName,
      last_name: payload.lastName,
      email: payload.email,
      password: payload.password,
      phone_number: payload.phoneNumber,
      tarif_jour: payload.tarifJour,
      domaine: payload.specialty,
      specialite: payload.specialty,
      portfolio_url: payload.portfolioUrl,
      message: payload.message,
    },
  });
}

export async function completeFreelancerProfile(
  accessToken: string,
  payload: {
    phoneNumber: string;
    tarifJour: number;
    bio: string | null;
    specialite: string | null;
  }
) {
  if (!accessToken.trim()) {
    throw new Error('Session invalide: token manquant.');
  }

  return invokeRemoteFunction(COMPLETE_PROFILE_FUNCTION_NAME, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    payload: {
      phone_number: payload.phoneNumber,
      tarif_jour: payload.tarifJour,
      bio: payload.bio,
      specialite: payload.specialite,
    },
  });
}

export async function fetchProfileByUserId(userId: string) {
  return invokeRemoteFunction<RemoteProfile | null>(PROFILE_GET_FUNCTION_NAME, {
    payload: { userId },
  });
}

export async function updateProfileRecord(userId: string, updates: Partial<RemoteProfile>) {
  return invokeRemoteFunction<RemoteProfile>(PROFILE_UPDATE_FUNCTION_NAME, {
    payload: { userId, updates },
  });
}

export async function updateFreelancerRecordByUserId(
  userId: string,
  updates: Record<string, unknown>
) {
  return invokeRemoteFunction(FREELANCER_UPDATE_FUNCTION_NAME, {
    payload: { userId, updates },
  });
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
  return invokeRemoteFunction(ADMIN_TALENT_STATUS_FUNCTION_NAME, {
    payload: { id, status },
  });
}
