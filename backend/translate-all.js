require('dotenv').config();
const db = require('./db');
const { translateText } = require('./utils/translator');

async function translateTexts(texts, targetLang) {
  const results = [];
  const chunkSize = 20; 

  for (let i = 0; i < texts.length; i += chunkSize) {
    const chunk = texts.slice(i, i + chunkSize);
    try {
      const chunkPromises = chunk.map(text => {
        if (!text || text.trim() === '' || !isNaN(text)) {
          return Promise.resolve(text);
        }
        return translateText(text, targetLang);
      });
      const translatedChunk = await Promise.all(chunkPromises);
      for (let j = 0; j < translatedChunk.length; j++) {
        if (translatedChunk[j] !== null) {
          results.push(translatedChunk[j]);
        } else {
          results.push(chunk[j]);
        }
      }
      await new Promise(r => setTimeout(r, 100)); // Delay between chunks
    } catch (error) {
      console.error(`Failed to translate chunk starting at index ${i}:`, error);
      results.push(...chunk);
    }
  }
  
  return results;
}

async function run() {
  const allIndianLangs = ['pa', 'bn', 'te', 'ta', 'gu', 'kn', 'ml', 'or', 'ur', 'as'];
  
  for (const lang of allIndianLangs) {
    console.log(`\n===========================================`);
    console.log(`Starting translation for ${lang.toUpperCase()}...`);
    
    // Check if already seeded to save time if script is rerun
    const [existing] = await db.query('SELECT COUNT(*) as count FROM translation_overrides WHERE lang = ?', [lang]);
    if (existing[0].count > 1000) {
      console.log(`${lang} already has ${existing[0].count} entries. Skipping...`);
      continue;
    }
    
    await db.query('DELETE FROM translation_overrides WHERE lang = ?', [lang]);
    
    const [enRows] = await db.query("SELECT namespace, key_path, value FROM translation_overrides WHERE lang = 'en'");
    
    const nsGroups = {};
    enRows.forEach(row => {
      if (!nsGroups[row.namespace]) nsGroups[row.namespace] = [];
      nsGroups[row.namespace].push(row);
    });
    
    for (const [ns, rows] of Object.entries(nsGroups)) {
      console.log(`Translating namespace: ${ns} (${rows.length} keys)...`);
      const texts = rows.map(r => r.value);
      const translatedTexts = await translateTexts(texts, lang);
      
      const values = [];
      const placeholders = [];
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const translatedValue = translatedTexts[i] || row.value;
        values.push(lang, ns, row.key_path, translatedValue);
        placeholders.push('(?, ?, ?, ?)');
      }
      
      // Batch insert 
      const batchSize = 1000;
      for (let i = 0; i < placeholders.length; i += batchSize) {
         const pChunk = placeholders.slice(i, i + batchSize);
         const vChunk = values.slice(i * 4, (i + batchSize) * 4);
         await db.query(
            `INSERT INTO translation_overrides (lang, namespace, key_path, value) VALUES ${pChunk.join(',')}`,
            vChunk
         );
      }
    }
    
    console.log(`Finished ${lang.toUpperCase()}!`);
  }
  
  console.log('All languages processed!');
  process.exit(0);
}

run();
