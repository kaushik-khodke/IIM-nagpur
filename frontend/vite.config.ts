  import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import { execSync } from 'child_process'

function log(msg: string) {
  try {
    const logFile = path.resolve(__dirname, 'vite_log.txt');
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`)
  } catch (e) {}
}

function downloadBackgroundVideos() {
  log('Starting downloader via curl...')
  const targetDir = path.resolve(__dirname, 'public', 'videos')
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true })
  }

  const videos = [
    { name: 'operator_search.mp4', url: 'https://assets.mixkit.co/videos/16069/16069-720.mp4' },
    { name: 'harvester_directory.mp4', url: 'https://assets.mixkit.co/videos/17727/17727-720.mp4' },
    { name: 'direct_messaging.mp4', url: 'https://assets.mixkit.co/videos/25137/25137-720.mp4' },
    { name: 'availability_tracking.mp4', url: 'https://assets.mixkit.co/videos/7727/7727-720.mp4' },
    { name: 'requirements_board.mp4', url: 'https://assets.mixkit.co/videos/25075/25075-720.mp4' },
    { name: 'location_filters.mp4', url: 'https://assets.mixkit.co/videos/25062/25062-720.mp4' },
    { name: 'farmer_registration.mp4', url: 'https://assets.mixkit.co/videos/28454/28454-720.mp4' },
    { name: 'post_requirement.mp4', url: 'https://assets.mixkit.co/videos/42655/42655-720.mp4' },
    { name: 'browse_matches.mp4', url: 'https://assets.mixkit.co/videos/16033/16033-720.mp4' },
    { name: 'connect_harvested.mp4', url: 'https://assets.mixkit.co/videos/21533/21533-720.mp4' }
  ]

  videos.forEach((video) => {
    const dest = path.join(targetDir, video.name)
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
      log(`${video.name} already exists, is non-empty and valid.`)
      return
    }

    if (fs.existsSync(dest)) {
      fs.unlinkSync(dest)
    }

    try {
      log(`Downloading via curl: ${video.name}...`)
      // Run curl.exe with standard browser headers and follow redirect flag (-L)
      const cmd = `curl.exe -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" -e "https://mixkit.co/" -L "${video.url}" -o "${dest}"`
      execSync(cmd, { stdio: 'ignore' })
      if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
        log(`Downloaded local asset via curl: ${video.name} (${fs.statSync(dest).size} bytes)`)
      } else {
        log(`Curl download failed for ${video.name}: File is empty or does not exist`)
      }
    } catch (err: any) {
      log(`Error downloading ${video.name} via curl: ${err.message}`)
    }
    
  })
}

// Trigger loop video downloads
downloadBackgroundVideos();

function copyStaticAssets() {
  log('Starting custom assets copy...');
  try {
    // Copy favicon.ico from icon-192x192.png if it doesn't exist
    const faviconDest = path.resolve(__dirname, 'public', 'favicon.ico');
    const faviconSrc = path.resolve(__dirname, 'public', 'icons', 'icon-192x192.png');
    if (fs.existsSync(faviconSrc) && !fs.existsSync(faviconDest)) {
      fs.copyFileSync(faviconSrc, faviconDest);
      log('Successfully copied favicon.ico');
    }

    // Copy generated blog-punjab-farmers.png to public directory
    const blogDest = path.resolve(__dirname, 'public', 'blog-punjab-farmers.png');
    const blogSrc = 'C:\\Users\\ASUS\\.gemini\\antigravity-ide\\brain\\1af138df-da10-48ca-a2cc-9df8f2a5c6f2\\blog_punjab_farmers_1783801147760.png';
    if (fs.existsSync(blogSrc) && !fs.existsSync(blogDest)) {
      fs.copyFileSync(blogSrc, blogDest);
      log('Successfully copied blog-punjab-farmers.png');
    }
  } catch (e: any) {
    log(`Error copying assets: ${e.message}`);
  }
}

// Trigger assets copy
copyStaticAssets();

function uploadAssetServer() {
  return {
    name: 'upload-asset-server',
    configureServer(server: { middlewares: { use: (arg0: (req: any, res: any, next: any) => void) => void } }) {
      server.middlewares.use((req, res, next) => {
        const urlPath = req.url?.split('?')[0];
        const isSaveVideo = urlPath === '/dev-save-video';
        const isSaveIcon = urlPath === '/dev-save-icon';
        if (!isSaveVideo && !isSaveIcon) {
          next();
          return;
        }
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'x-filename, content-type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end();
          return;
        }

        if (req.method === 'POST') {
          const filename = req.headers['x-filename'];
          if (!filename) {
            res.statusCode = 400;
            res.end('Missing x-filename header');
            return;
          }

          log(`Vite upload endpoint receiving file: ${filename}`);
          const subfolder = isSaveVideo ? 'videos' : 'icons';
          const targetDir = path.resolve(__dirname, 'public', subfolder);
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }

          const dest = path.join(targetDir, filename as string);
          const fileStream = fs.createWriteStream(dest);
          req.pipe(fileStream);

          req.on('end', () => {
            fileStream.close(() => {
              log(`Vite upload endpoint saved file: ${filename} (${fs.statSync(dest).size} bytes)`);
              res.statusCode = 200;
              res.end('Successfully saved');
            });
          });

          req.on('error', (err: { message: any }) => {
            log(`Vite upload endpoint error: ${err.message}`);
            res.statusCode = 500;
            res.end(`Error saving file: ${err.message}`);
          });
          return;
        }
      });
    }
  };
}

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id: string) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    uploadAssetServer(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
