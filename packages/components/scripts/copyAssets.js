const fs = require('fs-extra');
const path = require('path');

const images = path.resolve(__dirname, '../src/images');
const lib = path.resolve(__dirname, '../lib');

fs.copySync(images, path.join(lib, 'images'));
