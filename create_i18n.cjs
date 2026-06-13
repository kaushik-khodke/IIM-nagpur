const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'i18n', 'locales');
const langs = ['en', 'hi', 'mr'];
const files = ['common.json', 'auth.json', 'dashboard.json', 'pages.json', 'messages.json', 'validation.json', 'static.json'];

// Create directories
fs.mkdirSync(path.join(__dirname, 'src', 'i18n'), { recursive: true });
langs.forEach(lang => {
  fs.mkdirSync(path.join(localesDir, lang), { recursive: true });
  files.forEach(file => {
    const filePath = path.join(localesDir, lang, file);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '{\n}\n');
    }
  });
});

console.log('Directories and empty JSON files created successfully.');
