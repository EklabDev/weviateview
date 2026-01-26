const fs = require('fs');
const path = require('path');

// Copy icon.png to dist folder
const sourceIcon = path.join(__dirname, '../icon.png');
const destIcon = path.join(__dirname, '../dist/icon.png');

if (fs.existsSync(sourceIcon)) {
  // Ensure dist directory exists
  const distDir = path.dirname(destIcon);
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  
  fs.copyFileSync(sourceIcon, destIcon);
  console.log('Icon copied to dist/icon.png');
} else {
  console.warn('icon.png not found, skipping icon copy');
}
