/**
 * Utility script. Not part of example itself. It only helps put the example together
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const vendorPath = path.join(__dirname, 'vendor');
const inlineScriptPath = path.join(vendorPath, 'trezor-connect.js');
const usbPermissionsScriptPath = path.join(vendorPath, 'trezor-usb-permissions.js');
const contentScriptPath = path.join(vendorPath, 'trezor-content-script.js');

if (!fs.existsSync(vendorPath)) {
    fs.mkdirSync(vendorPath);
}

[inlineScriptPath, contentScriptPath, usbPermissionsScriptPath].forEach(path => {
    if (fs.existsSync(path)) {
        fs.rmSync(path);
    }
})

fetch('https://connect.trezor.io/9/trezor-connect.js')
    .then(response => response.text())
    .then(text => fs.writeFileSync(path.join(__dirname, 'vendor', 'trezor-connect.js'), text));

    const srcPath = path.join(__dirname, '../../connect-web/src/webextension');

fs.copyFileSync(path.join(srcPath, 'trezor-content-script.js'), contentScriptPath);
fs.copyFileSync(path.join(srcPath, 'trezor-usb-permissions.js'), usbPermissionsScriptPath);

// todo: copy trezor-usb-permissions?
