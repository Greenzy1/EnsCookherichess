/**
 * Netlify Function: Ask Gemini (Node.js)
 * Yerine geçtiği PHP dosyasının güvenli Node.js versiyonu.
 */

export const handler = async (event, context) => {
  // Sadece POST isteklerine izin ver
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const input = JSON.parse(event.body);
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Netlify Dashboard'dan ayarlanacak
    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

    let prompt = "";
    if (input.mode === 'analysis') {
      const { place_name, place_details, rating, reviews } = input;
      const reviewsText = (reviews || []).join("
- ");
      prompt = `Sen bir gurme analiz uzmanısın. Şu mekan hakkında Google verilerine dayanarak kısa bir analiz yap:
      Mekan Adı: ${place_name}
      Adres: ${place_details}
      Puan: ${rating}
      Kullanıcı Yorumları:
      - ${reviewsText}
      
      Lütfen şu soruları yanıtla: Neden buraya gidilmeli? Mekanın atmosferi nasıl? (Kısa ve öz, samimi bir dil kullan).`;
    } else {
      prompt = `Kullanıcı bir mekan arıyor: '${input.message}'. Ona öneride bulun ve samimi bir cevap ver.`;
    }

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Üzgünüm, şu an analiz yapamıyorum.";

    return {
      statusCode: 200,
      body: JSON.stringify({ answer: aiText })
    };

  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "İç sunucu hatası: " + error.message })
    };
  }
};