const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src/app/components');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

const replacements = {
  // Orange -> Navy Blue
  '#E8720C': '#172263',
  '#C9610A': '#11194A',
  'orange-50': 'blue-50',
  'orange-100': 'blue-100',
  'orange-200': 'blue-200',
  'orange-300': 'blue-300',
  'orange-700': 'blue-700',
  'orange-900': 'blue-900',
  'text-orange-100': 'text-blue-100',
  'text-orange-200': 'text-blue-200',
  'text-orange-300': 'text-blue-300',

  // Dark Text -> Black
  '#1C1008': '#1A1A1A',

  // Muted Text -> Medium Gray
  '#78716C': '#57585A',

  // Backgrounds -> White / Light Gray
  '#FDFAF4': '#ffffff',
  '#FEF3E2': '#F4F6FA',
  '#F0FDF4': '#F4F6FA',

  // Borders -> Light Gray
  '#E7E0D5': '#E2E8F0', // standard tailwind slate-200, or #F4F6FA

  // Gradients
  'from-[#E8720C] to-[#15803D]': 'from-[#172263] to-[#E82326]', // Navy to Red gradient
  'bg-gradient-to-br from-[#E8720C] to-[#D97706]': 'bg-gradient-to-br from-[#172263] to-[#11194A]',
  
  // Specific green text in some places can become Red (Accent)
  // But let's leave green alone if it means success (like "Verified").
};

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  for (const [oldVal, newVal] of Object.entries(replacements)) {
    content = content.split(oldVal).join(newVal);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
