/**
 * Utility script. Not part of example itself. It only helps put the example together
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const vendorPath = path.join(__dirname, 'vendor');

if (fs.existsSync(vendorPath)) {
    fs.rmdirSync(vendorPath);
    fs.mkdirSync(vendorPath);
} else {
    fs.mkdirSync(vendorPath);
}

fetch('https://connect.trezor.io/9/trezor-connect.js')
    .then(response => response.text())
    .then(text => fs.writeFileSync(path.join(__dirname, 'vendor', 'trezor-connect.js'), text));

// todo: copy trezor-usb-permissions?
