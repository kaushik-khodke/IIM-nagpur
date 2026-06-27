/**
 * Download a new farmer registration video from Mixkit.
 * 
 * Run this script with: node download_farmer_reg.cjs
 * 
 * This tries Mixkit video ID 28454 (a farmer/agriculture video).
 * If the first ID fails, it tries alternatives.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const targetDir = path.resolve(__dirname, 'public', 'videos');
const dest = path.join(targetDir, 'farmer_registration.mp4');

// Remove old person_registration.mp4 if it exists
const oldFile = path.join(targetDir, 'person_registration.mp4');
if (fs.existsSync(oldFile)) {
  console.log('Removing old person_registration.mp4...');
  fs.unlinkSync(oldFile);
}

// Try these Mixkit IDs - they are agriculture/farming related
const candidates = [
  { id: '28454', desc: 'farmer agriculture' },
  { id: '28438', desc: 'agriculture field' },
  { id: '28448', desc: 'agriculture tech' },
  { id: '28460', desc: 'farmer working' },
  { id: '9553', desc: 'wheat field farmer' },
  { id: '9557', desc: 'farmer field' },
  { id: '4814', desc: 'farmer harvesting' },
  { id: '4818', desc: 'agriculture worker' },
  { id: '22398', desc: 'farmer crops' },
  { id: '22414', desc: 'farm worker field' },
];

let downloaded = false;

for (const c of candidates) {
  if (downloaded) break;
  const url = `https://assets.mixkit.co/videos/${c.id}/${c.id}-720.mp4`;
  console.log(`Trying Mixkit ID ${c.id} (${c.desc})...`);

  try {
    const cmd = `curl.exe -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" -e "https://mixkit.co/" -L "${url}" -o "${dest}"`;
    execSync(cmd, { timeout: 60000 });
    
    if (fs.existsSync(dest)) {
      const size = fs.statSync(dest).size;
      if (size > 500000) {
        console.log(`\n✅ SUCCESS! Downloaded Mixkit ID ${c.id} as farmer_registration.mp4 (${(size / 1024 / 1024).toFixed(1)} MB)`);
        downloaded = true;
      } else {
        console.log(`  ID ${c.id}: File too small (${size} bytes), skipping...`);
        fs.unlinkSync(dest);
      }
    }
  } catch (err) {
    console.log(`  ID ${c.id}: Error - ${err.message}`);
    if (fs.existsSync(dest)) fs.unlinkSync(dest);
  }
}

if (!downloaded) {
  console.log('\n❌ No valid video found. Please manually download a farmer video from https://mixkit.co/free-stock-video/agriculture/');
  console.log('Save it as: public/videos/farmer_registration.mp4');
}
