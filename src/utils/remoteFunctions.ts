import { ensureSerializablePayload, runWithAsyncGuard } from './asyncTools';
import { getOptionalEnv, getRequiredEnv, getRequiredHttpUrlEnv } from './env';

const SUPABASE_URL = getRequiredHttpUrlEnv('VITE_SUPABASE_URL').replace(/\/+$/, '');
const SUPABASE_ANON_KEY = getRequiredEnv('VITE_SUPABASE_ANON_KEY');

const CONTACT_FUNCTION_NAME = getOptionalEnv('VITE_CONTACT_FUNCTION_NAME', 'contact-submit');
const JOIN_FUNCTION_NAME = getOptionalEnv('VITE_JOIN_FUNCTION_NAME', 'freelancer-apply');
const PUBLIC_TALENTS_FUNCTION_NAME = getOptionalEnv(
  'VITE_PUBLIC_TALENTS_FUNCTION_NAME',
  'public-talents-list'
);
const COMPLETE_PROFILE_FUNCTION_NAME = getOptionalEnv(
  'VITE_COMPLETE_PROFILE_FUNCTION_NAME',
  'complete-profile'
);
const ADMIN_LIST_FREELANCERS_FUNCTION_NAME = getOptionalEnv(
  'VITE_ADMIN_LIST_FREELANCERS_FUNCTION_NAME',
  'admin-list-freelancers'
);
const ADMIN_VALIDATE_FREELANCER_FUNCTION_NAME = getOptionalEnv(
  'VITE_ADMIN_VALIDATE_FREELANCER_FUNCTION_NAME',
  'admin-validate-freelancer'
);
const ADMIN_LIST_CONTACTS_FUNCTION_NAME = getOptionalEnv(
  'VITE_ADMIN_LIST_CONTACTS_FUNCTION_NAME',
  'admin-list-contacts'
);

type FunctionResponse = {
  error?: string;
  message?: string;
};

type HttpMethod = 'GET' | 'POST';

interface RemoteInvokeOptions<TPayload extends Record<string, unknown> | undefined> {
  method?: HttpMethod;
  payload?: TPayload;
  headers?: Record<string, string>;
  timeoutMs?: number;
  accessToken?: string;
  query?: Record<string, string | number | undefined>;
}

export interface PublicTalentPortfolio {
  title: string;
  type: string;
  url: string;
  order: number;
}

export interface PublicTalentRecord {
  id: string;
  user_id: string;
  full_name?: string | null;
  name?: string | null;
  avatar_url?: string | null;
  domaine?: string | null;
  domain?: string | null;
  specialite?: string | null;
  specialty?: string | null;
  bio?: string | null;
  tarif_jour?: number | null;
  day_rate?: number | null;
  disponible?: boolean;
  available?: boolean;
  portfolio_url?: string | null;
  portfolioUrl?: string | null;
  portfolio_count?: number;
  rating?: number;
  total_projects?: number;
  portfolios?: PublicTalentPortfolio[];
}

export interface AdminFreelancerRecord {
  id: string;
  user_id: string;
  domaine: string;
  specialite: string | null;
  portfolio_url: string | null;
  phone_number: string | null;
  tarif_jour: number | null;
  bio: string | null;
  statut: 'pending' | 'validated' | 'rejected' | 'suspended';
  onboarding_completed: boolean;
  created_at: string;
  profiles?: {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
  } | null;
}

export interface AdminListFreelancersResponse {
  data: AdminFreelancerRecord[];
  total: number;
  limit: number;
  offset: number;
}

export interface AdminContactRecord {
  id: string;
  nom?: string | null;
  name?: string | null;
  email?: string | null;
  phone_number?: string | null;
  phone?: string | null;
  entreprise?: string | null;
  company?: string | null;
  type_projet?: string | null;
  project_type?: string | null;
  budget_estime?: string | null;
  budget?: string | null;
  message?: string | null;
  created_at?: string | null;
  status?: string | null;
}

export interface AdminListContactsResponse {
  data: AdminContactRecord[];
  total?: number;
  limit?: number;
  offset?: number;
}

function buildFunctionUrl(
  functionName: string,
  query?: Record<string, string | number | undefined>
) {
  const url = new URL(`${SUPABASE_URL}/functions/v1/${functionName}`);

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (typeof value === 'undefined' || value === '') return;
    url.searchParams.set(key, String(value));
  });

  return url.toString();
}

async function extractResponseError(response: Response): Promise<string> {
  try {
    const payload = (await response.clone().json()) as FunctionResponse;
    if (payload.error) return payload.error;
    if (payload.message) return payload.message;
  } catch {
    try {
      const text = await response.clone().text();
      if (text) return text;
    } catch {
      // Ignore parsing failures and fallback below.
    }
  }

  return `Erreur serveur (${response.status})`;
}

async function parseResponse<TResult>(response: Response): Promise<TResult> {
  if (response.status === 204) {
    return null as TResult;
  }

  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return (await response.json()) as TResult;
  }

  const text = await response.text();
  return text ? (text as TResult) : (null as TResult);
}

async function invokeRemoteFunction<
  TResult,
  TPayload extends Record<string, unknown> = Record<string, unknown>,
>(functionName: string, options: RemoteInvokeOptions<TPayload> = {}): Promise<TResult> {
  const method = options.method ?? 'POST';
  const payload = ensureSerializablePayload(
    options.payload ?? ({} as TPayload),
    `remote:${functionName}`
  );

  return runWithAsyncGuard(
    `edge:${functionName}`,
    async () => {
      const response = await fetch(buildFunctionUrl(functionName, options.query), {
        method,
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${options.accessToken ?? SUPABASE_ANON_KEY}`,
          ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
          ...(options.headers ?? {}),
        },
        ...(method === 'POST' ? { body: JSON.stringify(payload) } : {}),
      });

      if (!response.ok) {
        throw new Error(await extractResponseError(response));
      }

      const data = await parseResponse<TResult | FunctionResponse>(response);

      if (data && typeof data === 'object' && 'error' in data && data.error) {
        throw new Error(data.error);
      }

      return data as TResult;
    },
    {
      fallbackMessage: `Le service distant "${functionName}" ne répond pas.`,
      metadata: {
        functionName,
        method,
      },
      ...(typeof options.timeoutMs === 'number' ? { timeoutMs: options.timeoutMs } : {}),
    }
  );
}

export async function submitContact(payload: {
  nom: string;
  email: string;
  phone_number?: string;
  entreprise?: string;
  type_projet?: string;
  budget_estime?: string;
  message: string;
}) {
  return invokeRemoteFunction(CONTACT_FUNCTION_NAME, {
    method: 'POST',
    payload,
  });
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
    method: 'POST',
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
    method: 'POST',
    accessToken,
    payload: {
      phone_number: payload.phoneNumber,
      tarif_jour: payload.tarifJour,
      ...(payload.bio ? { bio: payload.bio } : {}),
      ...(payload.specialite ? { specialite: payload.specialite } : {}),
    },
  });
}

export async function listPublicTalents() {
  const data = await invokeRemoteFunction<PublicTalentRecord[] | { data?: PublicTalentRecord[] }>(
    PUBLIC_TALENTS_FUNCTION_NAME,
    {
      method: 'GET',
    }
  );

  if (Array.isArray(data)) return data;
  return Array.isArray(data?.data) ? data.data : [];
}

export async function listAdminFreelancers(
  accessToken: string,
  options: {
    status?: 'pending' | 'validated' | 'rejected' | 'suspended';
    limit?: number;
    offset?: number;
  } = {}
) {
  const data = await invokeRemoteFunction<AdminListFreelancersResponse>(
    ADMIN_LIST_FREELANCERS_FUNCTION_NAME,
    {
      method: 'GET',
      accessToken,
      query: {
        status: options.status,
        limit: options.limit,
        offset: options.offset,
      },
    }
  );

  return {
    data: Array.isArray(data?.data) ? data.data : [],
    total: typeof data?.total === 'number' ? data.total : 0,
    limit: typeof data?.limit === 'number' ? data.limit : (options.limit ?? 20),
    offset: typeof data?.offset === 'number' ? data.offset : (options.offset ?? 0),
  };
}

export async function validateAdminFreelancer(
  accessToken: string,
  freelancerId: string,
  decision: 'validated' | 'rejected',
  motif?: string
) {
  const trimmedMotif = motif?.trim();

  return invokeRemoteFunction(ADMIN_VALIDATE_FREELANCER_FUNCTION_NAME, {
    method: 'POST',
    accessToken,
    payload: {
      freelancer_id: freelancerId,
      decision,
      ...(decision === 'rejected'
        ? {
            status: 'rejected',
            ...(trimmedMotif ? { motif: trimmedMotif, rejection_reason: trimmedMotif } : {}),
          }
        : {}),
    },
  });
}

export async function listAdminContacts(
  accessToken: string,
  options: {
    limit?: number;
    offset?: number;
  } = {}
) {
  const data = await invokeRemoteFunction<AdminListContactsResponse | AdminContactRecord[]>(
    ADMIN_LIST_CONTACTS_FUNCTION_NAME,
    {
      method: 'GET',
      accessToken,
      query: {
        limit: options.limit,
        offset: options.offset,
      },
    }
  );

  if (Array.isArray(data)) {
    return {
      data,
      total: data.length,
      limit: options.limit ?? data.length,
      offset: options.offset ?? 0,
    };
  }

  return {
    data: Array.isArray(data?.data) ? data.data : [],
    total:
      typeof data?.total === 'number'
        ? data.total
        : Array.isArray(data?.data)
          ? data.data.length
          : 0,
    limit: typeof data?.limit === 'number' ? data.limit : (options.limit ?? 20),
    offset: typeof data?.offset === 'number' ? data.offset : (options.offset ?? 0),
  };
}
