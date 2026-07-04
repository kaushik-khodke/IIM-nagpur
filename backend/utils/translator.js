/**
 * Utility for translating text using Google Translate's free API.
 * Uses native fetch.
 */

async function translateText(text, targetLang) {
  if (!text || typeof text !== 'string' || text.trim() === '') {
    return null;
  }

  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`Translation to ${targetLang} failed with status: ${res.status}`);
      return null;
    }
    const json = await res.json();
    if (json && json[0]) {
      return json[0].map(item => item[0]).join('');
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
