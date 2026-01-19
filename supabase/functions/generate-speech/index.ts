import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY')
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
const AZURE_SPEECH_KEY = Deno.env.get('AZURE_SPEECH_KEY')
const AZURE_REGION = Deno.env.get('AZURE_REGION')

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const text = body.input || body.text
    const voice = body.voice || 'nova'
    const speed = body.speed || 1.0

    // Detection Logic - Expanded Azure Voices for Spanish Children's Learning
    const azureVoices = [
      // Primary Child Voices
      'es-MX-MarinaNeural',      // Child voice (★ Primary)
      'es-MX-YagoNeural',         // Young boy
      'es-MX-NuriaNeural',        // Young girl

      // Young Adult Voices
      'es-MX-BeatrizNeural',      // Young adult female (service workers)
      'es-MX-CecilioNeural',      // Young adult male
      'es-MX-PelayoNeural',       // Young male

      // Adult Voices
      'es-MX-DaliaNeural',        // Professional female
      'es-MX-CandelaNeural',      // Energetic female
      'es-MX-LarisaNeural',       // Playful female
      'es-MX-RenataNeural',       // Maternal female
      'es-MX-JorgeNeural',        // Adult male
      'es-MX-LucianoNeural',      // Uncle/guide male

      // English Kid Voices (fallback)
      'en-US-AnaNeural',
      'en-US-ChristopherNeural'
    ];
    const isAzure = azureVoices.includes(voice) || (voice.includes('-') && voice.includes('Neural'));

    let audioUrl = '';

    if (isAzure && AZURE_SPEECH_KEY && AZURE_REGION) {
      console.log(`Using Azure for voice: ${voice}`);
      // Azure REST API supports SSML
      const locale = voice.split('-').slice(0, 2).join('-');
      const ssml = `
        <speak version='1.0' xml:lang='${locale}'>
          <voice xml:lang='${locale}' name='${voice}'>
            <prosody rate="${speed}">
              ${text}
            </prosody>
          </voice>
        </speak>
      `;

      const res = await fetch(`https://${AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': AZURE_SPEECH_KEY,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
          'User-Agent': 'LumiLibro-TTS'
        },
        body: ssml
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Azure API error (${res.status}): ${errorText}`);
      }

      const audioBlob = await res.blob();
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < uint8Array.byteLength; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      audioUrl = `data:audio/mpeg;base64,${btoa(binary)}`;

    } else {
      console.log(`Using OpenAI for voice: ${voice}`);
      if (!OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is not set.");
      }

      const res = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'tts-1', input: text, voice: voice, speed: speed }),
      })

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`OpenAI API error (${res.status}): ${errorText}`);
      }

      const audioBlob = await res.blob();
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < uint8Array.byteLength; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      audioUrl = `data:audio/mpeg;base64,${btoa(binary)}`;
    }

    return new Response(JSON.stringify({ audioUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error("Function Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})
