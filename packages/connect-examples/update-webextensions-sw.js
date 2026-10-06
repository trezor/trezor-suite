/**
 * Utility script. Not part of example itself. It only helps put the example together.
 */

const fs = require('fs');
const path = require('path');

const rootPaths = ['webextension'];

const trezorConnectSrcIndex = process.argv.indexOf('--trezor-connect-src');
const buildFolderIndex = process.argv.indexOf('--build-folder');

const DEFAULT_SRC = 'https://suite.trezor.io/web/connect-popup';
let trezorConnectSrc = DEFAULT_SRC;

if (trezorConnectSrcIndex > -1) {
    trezorConnectSrc = process.argv[trezorConnectSrcIndex + 1];
    console.log('trezorConnectSrc: ', trezorConnectSrc);
}

let buildFolder = 'build';
if (buildFolderIndex > -1) {
    buildFolder = process.argv[buildFolderIndex + 1];
    console.log('buildFolder: ', buildFolder);
}

rootPaths.forEach(dir => {
    const rootPath = path.join(__dirname, dir);
    const buildPath = path.join(rootPath, buildFolder);

    fs.readdirSync(buildPath).forEach(p => {
        // Skip TypeScript source files - they should no longer exist
        if (p.endsWith('.ts') || p.endsWith('.tsx')) {
            return;
        }

        fs.readFile(path.join(buildPath, p), 'utf-8', (err, contents) => {
            if (err) {
                console.log(err);

                return;
            }
            const found = contents.startsWith(DEFAULT_SRC);
            if (found) {
                console.log(`Found ${DEFAULT_SRC} in ${p}, replacing with ${trezorConnectSrc}`);
            }

            const replaced = contents.replace(DEFAULT_SRC, trezorConnectSrc);

            fs.writeFile(path.join(buildPath, p), replaced, 'utf-8', err2 => {
                if (err2) {
                    console.log(err2);

                    return;
                }
            });
        });
    });
});
