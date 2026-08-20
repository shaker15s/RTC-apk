const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const indexHtmlPath = path.join(distDir, 'index.html');
const iconSrc = path.join(__dirname, '..', 'assets', 'icon.png');
const iconDest = path.join(distDir, 'favicon.png');

if (!fs.existsSync(distDir)) {
  console.log('dist directory not found. Run expo export first.');
  process.exit(1);
}

// Copy favicon
if (fs.existsSync(iconSrc)) {
  fs.copyFileSync(iconSrc, iconDest);
  console.log('Copied icon.png to favicon.png');
} else {
  console.log('Warning: assets/icon.png not found.');
}

// Inject meta tags
if (fs.existsSync(indexHtmlPath)) {
  let html = fs.readFileSync(indexHtmlPath, 'utf8');

  const metaTags = `
    <link rel="icon" href="/favicon.png">
    <meta name="theme-color" content="#00288E">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="description" content="مسار RTC — منصة مراكز رسالة للتدريب">
  `.trim();

  if (html.includes('</head>')) {
    html = html.replace('</head>', `  ${metaTags}\n</head>`);
    fs.writeFileSync(indexHtmlPath, html);
    console.log('Successfully injected meta tags into index.html');
  } else {
    console.log('Error: </head> tag not found in index.html');
  }
} else {
  console.log('Error: dist/index.html not found.');
}
