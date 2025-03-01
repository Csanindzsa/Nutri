const fs = require('fs');
const path = require('path');

const SOURCE_FILE = path.resolve(__dirname, '../react-ts-frontend/src/assets/images/logo.png');
const PUBLIC_DIR = path.resolve(__dirname, '../react-ts-frontend/public');

// Ensure public directory exists
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

// Copy the logo file to serve as favicon
try {
  // Copy to favicon.ico (not ideal but works as a fallback)
  fs.copyFileSync(SOURCE_FILE, path.join(PUBLIC_DIR, 'favicon.ico'));
  
  // Also copy as PNG for modern browsers
  fs.copyFileSync(SOURCE_FILE, path.join(PUBLIC_DIR, 'favicon.png'));
  fs.copyFileSync(SOURCE_FILE, path.join(PUBLIC_DIR, 'logo192.png'));
  
  console.log('Favicon files created successfully!');
  console.log('Note: For better results, use an online tool like https://realfavicongenerator.net/');
  console.log('to create properly sized favicon files.');
} catch (error) {
  console.error('Error creating favicon files:', error);
}
