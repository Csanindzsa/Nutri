const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SOURCE_FILE = path.resolve(__dirname, '../react-ts-frontend/src/assets/images/logo.png');
const OUTPUT_DIR = path.resolve(__dirname, '../react-ts-frontend/public');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Generate different sizes of the favicon
async function generateFavicons() {
  try {
    // 16x16 favicon
    await sharp(SOURCE_FILE)
      .resize(16, 16)
      .png()
      .toFile(path.join(OUTPUT_DIR, 'favicon-16x16.png'));
    
    // 32x32 favicon
    await sharp(SOURCE_FILE)
      .resize(32, 32)
      .png()
      .toFile(path.join(OUTPUT_DIR, 'favicon-32x32.png'));

    // 192x192 for Android
    await sharp(SOURCE_FILE)
      .resize(192, 192)
      .png()
      .toFile(path.join(OUTPUT_DIR, 'logo192.png'));

    // 512x512 for PWA
    await sharp(SOURCE_FILE)
      .resize(512, 512)
      .png()
      .toFile(path.join(OUTPUT_DIR, 'logo512.png'));

    // ICO format requires a converter library like 'to-ico'
    // This is a simplified example
    console.log('Generated PNG favicons successfully');
    console.log('Note: favicon.ico needs to be generated separately with a tool like https://realfavicongenerator.net/');

  } catch (error) {
    console.error('Error generating favicons:', error);
  }
}

generateFavicons();
