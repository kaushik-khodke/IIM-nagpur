const fs = require('fs');
const path = require('path');
const https = require('https');

const targetDir = path.join(__dirname, 'public', 'videos');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const videos = [
  { name: 'operator_search.mp4', url: 'https://assets.mixkit.co/videos/preview/mixkit-tractor-working-in-a-farm-field-41595-large.mp4' },
  { name: 'harvester_directory.mp4', url: 'https://assets.mixkit.co/videos/preview/mixkit-combine-harvester-working-in-wheat-field-41594-large.mp4' },
  { name: 'direct_messaging.mp4', url: 'https://assets.mixkit.co/videos/preview/mixkit-man-hands-using-a-smartphone-34318-large.mp4' },
  { name: 'availability_tracking.mp4', url: 'https://assets.mixkit.co/videos/preview/mixkit-close-up-of-a-tractor-wheel-in-motion-41597-large.mp4' },
  { name: 'requirements_board.mp4', url: 'https://assets.mixkit.co/videos/preview/mixkit-farmer-writing-on-a-clipboard-in-a-greenhouse-41599-large.mp4' },
  { name: 'location_filters.mp4', url: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-farmland-and-roads-41604-large.mp4' }
];

function downloadVideo(video) {
  return new Promise((resolve, reject) => {
    const dest = path.join(targetDir, video.name);
    const file = fs.createWriteStream(dest);

    // Set User-Agent to mimic browser so Mixkit doesn't block the request
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    };

    https.get(video.url, options, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${video.name}: HTTP ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`✓ Downloaded: ${video.name}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function run() {
  console.log('Downloading background videos to public/videos/...');
  for (const video of videos) {
    try {
      await downloadVideo(video);
    } catch (err) {
      console.error(`✗ Error downloading ${video.name}:`, err.message);
    }
  }
  console.log('Finished downloading all background loops!');
}

run();
