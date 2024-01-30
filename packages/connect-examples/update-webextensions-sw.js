/**
 * Utility script. Not part of example itself. It only helps put the example together.
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const rootPaths = ['webextension-mv3-sw'];

const trezorConnectSrcIndex = process.argv.indexOf('--trezor-connect-src');
const buildFolderIndex = process.argv.indexOf('--build-folder');
const npmSrcIndex = process.argv.indexOf('--npm-src');

const DEFAULT_SRC = 'https://connect.trezor.io/9/';
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

let npmSrc = '';
if (npmSrcIndex > -1) {
    npmSrc = process.argv[npmSrcIndex + 1];
    console.log('npmSrc: ', npmSrc);
}

rootPaths.forEach(dir => {
    const rootPath = path.join(__dirname, dir);
    const buildPath = path.join(rootPath, buildFolder);
    const vendorPath = path.join(buildPath, 'vendor');

    fs.rmSync(buildPath, { recursive: true, force: true });
    if (!fs.existsSync(buildPath)) {
        fs.mkdirSync(buildPath);
    }
    if (!fs.existsSync(vendorPath)) {
        fs.mkdirSync(vendorPath);
    }

    if (npmSrc) {
        fetch(npmSrc).then(res => {
            const dest = fs.createWriteStream(
                path.join(rootPath, buildFolder, 'vendor', 'trezor-connect-webextension.js'),
            );
            res.body.pipe(dest);
        });
    } else {
        ['trezor-connect-webextension.js', 'trezor-connect-webextension-proxy.js'].forEach(p => {
            fs.copyFileSync(
                path.join(__dirname, '../connect-webextension', 'build', p),
                path.join(rootPath, buildFolder, 'vendor', p),
            );
        });
    }

    fs.readdirSync(path.join(rootPath, 'src')).forEach(p => {
        // Some files like binary `.png` we just want to copy.
        const isJustCopied = ['.png'].some(ext => p.endsWith(ext));
        if (isJustCopied) {
            fs.copyFileSync(path.join(rootPath, 'src', p), path.join(rootPath, buildFolder, p));
            return;
        }
        fs.readFile(path.join(rootPath, 'src', p), 'utf-8', (err, contents) => {
            if (err) {
                console.log(err);
                return;
            }

            const replaced = contents.replace(DEFAULT_SRC, trezorConnectSrc);

            fs.writeFile(path.join(rootPath, buildFolder, p), replaced, 'utf-8', err => {
                if (err) {
                    console.log(err);
                    return;
                }
            });
        });
    });
});
