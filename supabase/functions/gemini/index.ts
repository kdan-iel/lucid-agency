import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// For TypeScript/IDE support when not running in Deno runtime
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Gérer les requêtes CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();

    // ✅ Validation basique
    if (!prompt || typeof prompt !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Prompt manquant ou invalide' }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (prompt.length > 5000) {
      return new Response(
        JSON.stringify({ error: 'Prompt trop long (max 5000 caractères)' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // ✅ La clé Gemini est lue depuis les secrets Supabase
    // Elle n'est JAMAIS exposée au navigateur
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Clé Gemini non configurée côté serveur');
    }

    // ✅ Appel à l'API Gemini depuis le serveur
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Erreur Gemini API: ${response.status}`);
    }

    const data = await response.json();

    return new Response(
      JSON.stringify(data),
      { status: 200, headers: corsHeaders }
    );

  } catch (err) {
    console.error('Gemini function error:', err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: corsHeaders }
    );
  }
});