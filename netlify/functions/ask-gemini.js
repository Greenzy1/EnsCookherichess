/**
 * Netlify Function: Ask Gemini (Stable v1 Update)
 */
export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const input = JSON.parse(event.body);
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_KEY") {
      return {
        statusCode: 200,
        body: JSON.stringify({ answer: "Hata: API Key eksik." })
      };
    }

    // Kararlı v1 sürümü ve 1.5-pro modeli
    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`;

    let prompt = "";
    if (input.mode === 'analysis') {
      prompt = `${input.place_name} hakkında efsanevi bir gurme analizi yap. Mekan bilgileri: ${input.place_details}`;
    } else {
      prompt = input.message;
    }

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    
    if (data.error) {
      return {
        statusCode: 200,
        body: JSON.stringify({ answer: "EnsAI Teknik Hatası: " + data.error.message })
      };
    }

    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Mekan analiz edilemedi.";

    return {
      statusCode: 200,
      body: JSON.stringify({ answer: aiText })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};