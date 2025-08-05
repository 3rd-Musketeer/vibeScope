// Simple icon generator for extension
// Creates placeholder icons using Canvas API (requires Node.js with canvas support)

const fs = require('fs');
const path = require('path');

// For a quick fix, let's create minimal SVG icons and convert them to PNG
// This approach works without additional dependencies

function createSVGIcon(size) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#007bff" rx="${size * 0.1}"/>
  <circle cx="${size * 0.4}" cy="${size * 0.4}" r="${size * 0.2}" fill="none" stroke="white" stroke-width="${size * 0.06}"/>
  <line x1="${size * 0.55}" y1="${size * 0.55}" x2="${size * 0.75}" y2="${size * 0.75}" stroke="white" stroke-width="${size * 0.06}" stroke-linecap="round"/>
</svg>`;
}

// Create SVG files as fallback
const sizes = [16, 48, 128];
sizes.forEach(size => {
  const svg = createSVGIcon(size);
  fs.writeFileSync(path.join(__dirname, `icon${size}.svg`), svg);
  console.log(`Created icon${size}.svg`);
});

console.log('\nSVG icons created as fallback.');
console.log('For PNG icons, either:');
console.log('1. Open create-icons.html in browser and download the generated images');
console.log('2. Use an online SVG to PNG converter');
console.log('3. Install canvas: npm install canvas, then run this script with PNG generation');