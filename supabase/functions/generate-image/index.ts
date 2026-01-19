import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

// Helper for DALL-E 3 Generation
async function generateWithDalle(prompt: string) {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY missing");

  console.log(`DALL-E 3 Fallback triggered for: "${prompt.substring(0, 50)}..."`);

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json"
    })
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("OpenAI API Error:", data);
    throw new Error(data.error?.message || "DALL-E 3 failed");
  }

  return `data:image/png;base64,${data.data[0].b64_json}`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt, provider } = await req.json()
    console.log(`[Edge Function] Generation Request: provider=${provider}, prompt="${prompt.substring(0, 50)}..."`)

    const placeholder = "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=1000&text=Magic+Book";

    // 1. Primary Path: Google Imagen
    if (provider === 'google') {
      try {
        if (!GOOGLE_API_KEY) throw new Error("GOOGLE_API_KEY missing");

        // Using Imagen 4.0 (Latest confirmed working model for this key)
        const gRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${GOOGLE_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ instances: [{ prompt }], parameters: { sampleCount: 1 } })
        });

        const data = await gRes.json();

        if (!gRes.ok) {
          console.warn(`Google API error (${gRes.status}), attempting DALL-E fallback...`);
          // Automatic Handover to DALL-E
          const dalleImage = await generateWithDalle(prompt);
          return new Response(JSON.stringify({ image: dalleImage, warning: "Switched to DALL-E after Google error" }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const b64 = data?.predictions?.[0]?.bytesBase64Encoded;
        if (!b64) throw new Error("No b64 in Google response");

        return new Response(JSON.stringify({ image: `data:image/png;base64,${b64}` }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (err) {
        console.error("Google primary path failed:", err.message);
        // Secondary Fallback to DALL-E
        try {
          const dalleImage = await generateWithDalle(prompt);
          return new Response(JSON.stringify({ image: dalleImage, warning: "Switched to DALL-E after Google exception" }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (dalleErr) {
          console.error("DALL-E fallback also failed:", dalleErr.message);
          return new Response(JSON.stringify({ image: placeholder, error: dalleErr.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }
    }

    // 2. Direct OpenAI Request
    if (provider === 'openai') {
      const image = await generateWithDalle(prompt);
      return new Response(JSON.stringify({ image }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 3. Unimplemented providers
    console.warn(`Provider ${provider} not found, using DALL-E as default.`);
    const image = await generateWithDalle(prompt);
    return new Response(JSON.stringify({ image, warning: "Used DALL-E for unknown provider" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Edge Function Fatal Error:", error.message);
    return new Response(JSON.stringify({
      image: "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=1000&text=Magic+Snag",
      error: error.message
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})
