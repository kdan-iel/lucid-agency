/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_CONTACT_FUNCTION_NAME?: string;
  readonly VITE_JOIN_FUNCTION_NAME?: string;
  readonly VITE_PROFILE_GET_FUNCTION_NAME?: string;
  readonly VITE_PROFILE_UPDATE_FUNCTION_NAME?: string;
  readonly VITE_FREELANCER_UPDATE_FUNCTION_NAME?: string;
  readonly VITE_PUBLIC_TALENTS_FUNCTION_NAME?: string;
  readonly VITE_ADMIN_TALENT_REQUESTS_FUNCTION_NAME?: string;
  readonly VITE_ADMIN_TALENT_STATUS_FUNCTION_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
