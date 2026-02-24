/**
 * EnsCookherichess - Netlify API Service
 */
const ApiService = {
    // Gemini AI'a analiz yaptır
    async askGemini(data) {
        try {
            const response = await fetch('/.netlify/functions/ask-gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) throw new Error('AI fonksiyonu başarısız.');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return { error: true, answer: 'Yapay zeka şu an uykuda. Daha sonra tekrar dene.' };
        }
    }
};