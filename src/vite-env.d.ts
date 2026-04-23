/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_CONTACT_FUNCTION_NAME?: string;
  readonly VITE_JOIN_FUNCTION_NAME?: string;
  readonly VITE_COMPLETE_PROFILE_FUNCTION_NAME?: string;
  readonly VITE_PUBLIC_TALENTS_FUNCTION_NAME?: string;
  readonly VITE_ADMIN_LIST_FREELANCERS_FUNCTION_NAME?: string;
  readonly VITE_ADMIN_VALIDATE_FREELANCER_FUNCTION_NAME?: string;
  readonly VITE_GAS_URL?: string;
  readonly VITE_GAS_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
