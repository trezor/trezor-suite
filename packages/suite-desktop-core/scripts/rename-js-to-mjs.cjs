/**
 * Electron-builder hooks in /scripts/*.ts are compiled to /lib/*.js
 * They are built as ESM, as required by some of the libs, but the whole module is still CJS.
 * Electron-builder needs to know that the hooks are ESM, so we rename the extension.
 * This is an interim solution while electron-main is still built as CJS.
 * TODO #14482 Delete this, update the filenames in electron-builder-config.js
 */

const fs = require('fs');
const path = require('path');

const libDir = path.join(__dirname, '../lib');

fs.readdirSync(libDir).forEach(file => {
    if (file.endsWith('.js')) {
        const oldPath = path.join(libDir, file);
        const newPath = path.join(libDir, file.replace(/\.js$/, '.mjs'));
        fs.renameSync(oldPath, newPath);
    }
});
console.log(`Renamed electron-builder hooks .js files to .mjs`);
