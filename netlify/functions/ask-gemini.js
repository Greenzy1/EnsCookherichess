/**
 * Netlify Function: Ask Gemini (Enhanced Debug Version)
 */
export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const input = JSON.parse(event.body);
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    // API Key Kontrolü
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_KEY") {
      return {
        statusCode: 200,
        body: JSON.stringify({ answer: "Hata: GEMINI_API_KEY bulunamadı. Lütfen Netlify panelinden Environment Variables kısmına ekleyin." })
      };
    }

    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    let prompt = "";
    if (input.mode === 'analysis') {
      const { place_name, place_details } = input;
      prompt = `${place_name} isimli mekan hakkında kısa, samimi ve iştah açıcı bir analiz yap. Şehir efsanesi gibi anlat. Detaylar: ${place_details}`;
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
    
    // Google API Hata Mesajı Kontrolü
    if (data.error) {
      return {
        statusCode: 200,
        body: JSON.stringify({ answer: "EnsAI Hatası: " + data.error.message })
      };
    }

    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Şu an bu mekanı analiz edemiyorum, sanırım gizli bir yer!";

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