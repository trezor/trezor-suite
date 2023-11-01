const fs = require('fs');
const path = require('path');

const contentScript = fs.readFileSync(path.join(__dirname, '../dist/content-script.js'), 'utf8');

const buildResultPath = path.join(__dirname, '../build/trezor-connect-webextension.js');
const buildResult = fs.readFileSync(buildResultPath, 'utf8');

const replaceToken = '// <!--content-script-->';
const updated = buildResult.replace(replaceToken, contentScript);

fs.writeFileSync(buildResultPath, updated, 'utf8');

console.log('replace done');
