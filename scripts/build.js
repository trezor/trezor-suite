import fs from 'fs-extra';
import path from 'path';

const images = path.resolve(__dirname, '../src/images');
const lib = path.resolve(__dirname, '../lib');

fs.copy(images, path.join(lib, 'images'));
