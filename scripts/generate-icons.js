const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const svgPath = path.join(__dirname, '..', 'images', 'icon.svg');
const pngPath = path.join(__dirname, '..', 'images', 'icon.png');
const svg = fs.readFileSync(svgPath);

// Convert to PNG (128x128)
sharp(svg)
  .resize(128, 128)
  .png()
  .toFile(pngPath)
  .then(() => {
    console.log('✓ Created PNG icon at:', pngPath);
  })
  .catch(err => {
    console.error('Error creating PNG:', err);
  });

// Also create different sizes if needed
const sizes = [256];

Promise.all(
  sizes.map(size => {
    return sharp(svg)
      .resize(size, size)
      .png()
      .toFile(path.join(__dirname, '..', 'images', `icon-${size}.png`))
      .then(() => {
        console.log(`✓ Created ${size}x${size} PNG icon`);
      });
  })
).catch(err => {
  console.error('Error creating additional sizes:', err);
});
