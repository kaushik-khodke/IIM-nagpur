/**
 * Utility for translating text using Google Translate's free API.
 * Uses native fetch.
 */

async function translateText(text, targetLang) {
  if (!text || typeof text !== 'string' || text.trim() === '') {
    return null;
  }

  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) {
    console.warn("GOOGLE_TRANSLATE_API_KEY is not set. Skipping translation to avoid exposing PII to public endpoint.");
    return null;
  }

  const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        target: targetLang,
        format: 'text'
      })
    });
    if (!res.ok) {
      console.warn(`Translation to ${targetLang} failed with status: ${res.status}`);
      return null;
    }
    const json = await res.json();
    if (json && json.data && json.data.translations && json.data.translations[0]) {
      return json.data.translations[0].translatedText;
    }
    return null;
  } catch (error) {
    console.error(`Error translating text to ${targetLang}:`, error.message);
    return null; // Fallback to returning null so DB stays consistent
  }
}

/**
 * Translates English text to 12 major Indian languages.
 * @param {string} text - English text to translate
 * @returns {Promise<Record<string, string | null>>}
 */
async function getTranslations(text) {
  const targetLangs = ['hi', 'mr', 'bn', 'te', 'ta', 'gu', 'kn', 'ml', 'pa', 'or', 'as', 'ur'];
  const translations = {};
  
  if (!text) {
    return translations;
  }

  // To avoid hitting API rate limits from Google Translate, we will map them sequentially
  // with a tiny delay, or run in small parallel batches. Let's do small parallel batches.
  const batchSize = 3;
  for (let i = 0; i < targetLangs.length; i += batchSize) {
    const chunk = targetLangs.slice(i, i + batchSize);
    const chunkPromises = chunk.map(async (lang) => {
      const translated = await translateText(text, lang);
      translations[lang] = translated;
    });
    await Promise.all(chunkPromises);
    
    // tiny delay between batches
    if (i + batchSize < targetLangs.length) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  return translations;
}

module.exports = {
  translateText,
  getTranslations
};
