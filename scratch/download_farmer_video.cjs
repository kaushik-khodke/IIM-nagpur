const https = require('https');
const fs = require('fs');
const path = require('path');

const targetDir = path.resolve(__dirname, 'public', 'videos');
const dest = path.join(targetDir, 'farmer_registration.mp4');

// Mixkit video ID 28454 - a farmer/agriculture related video
const url = 'https://assets.mixkit.co/videos/28454/28454-720.mp4';

const options = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://mixkit.co/'
  }
};

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, options, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlinkSync(dest);
        console.log('Following redirect to:', response.headers.location);
        download(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode === 403) {
        file.close();
        fs.unlinkSync(dest);
        reject(new Error('403 Forbidden'));
        return;
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        const size = fs.statSync(dest).size;
        console.log(`Downloaded: ${(size / 1024 / 1024).toFixed(1)} MB`);
        resolve(size);
      });
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      reject(err);
    });
  });
}

// Try a list of candidate Mixkit IDs
const candidates = [28454, 28448, 49997, 50119, 34197, 50007, 33773, 41595, 28438, 28460];

async function main() {
  for (const id of candidates) {
    const u = `https://assets.mixkit.co/videos/${id}/${id}-720.mp4`;
    console.log(`Trying ID ${id}...`);
    try {
      const size = await download(u, dest);
      if (size > 100000) {
        console.log(`SUCCESS with ID ${id}`);
        return;
      }
    } catch (err) {
      console.log(`ID ${id}: ${err.message}`);
    }
  }
  console.log('All candidates failed.');
}

main();
