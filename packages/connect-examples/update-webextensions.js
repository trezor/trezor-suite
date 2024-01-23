/**
 * Utility script. Not part of example itself. It only helps put the example together.
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const rootPaths = ['webextension-mv2', 'webextension-mv3'];

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

    const inlineScriptPath = path.join(vendorPath, 'trezor-connect.js');
    const usbPermissionsScriptPath = path.join(vendorPath, 'trezor-usb-permissions.js');
    const usbPermissionsHtmlPath = path.join(rootPath, 'trezor-usb-permissions.html');
    const contentScriptPath = path.join(vendorPath, 'trezor-content-script.js');
    const backgroundScriptPath = path.join(rootPath, 'background.js');

    fs.rmSync(buildPath, { recursive: true, force: true });
    if (!fs.existsSync(buildPath)) {
        fs.mkdirSync(buildPath);
    }
    if (!fs.existsSync(vendorPath)) {
        fs.mkdirSync(vendorPath);
    }

    [inlineScriptPath, usbPermissionsScriptPath, usbPermissionsHtmlPath, contentScriptPath].forEach(
        path => {
            if (fs.existsSync(path)) {
                fs.rmSync(path);
            }
        },
    );

    const srcPath = path.join(__dirname, '../connect-web');

    ['trezor-content-script.js'].forEach(p => {
        fs.copyFileSync(
            path.join(srcPath, 'src', 'webextension', p),
            path.join(rootPath, buildFolder, 'vendor', p),
        );
    });

    ['trezor-usb-permissions.js'].forEach(p => {
        let content = fs.readFileSync(path.join(srcPath, 'src', 'webextension', p), 'utf-8');
        if (trezorConnectSrc !== DEFAULT_SRC) {
            content = content.replace(/^const url = .*$/gm, `const url = '${trezorConnectSrc}';`);
        }
        fs.writeFileSync(path.join(rootPath, buildFolder, 'vendor', p), content, 'utf-8');
    });

    ['trezor-usb-permissions.html'].forEach(p => {
        fs.copyFileSync(
            path.join(srcPath, 'src', 'webextension', p),
            path.join(rootPath, buildFolder, p),
        );
    });

    if (npmSrc) {
        fetch(npmSrc).then(res => {
            const dest = fs.createWriteStream(
                path.join(rootPath, buildFolder, 'vendor', 'trezor-connect.js'),
            );
            res.body.pipe(dest);
        });
    } else {
        ['trezor-connect.js'].forEach(p => {
            fs.copyFileSync(
                path.join(srcPath, 'build', p),
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
