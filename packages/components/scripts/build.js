// eslint-disable-next-line import/no-extraneous-dependencies
import fs from 'fs-extra';
import path from 'path';
import packageJson from '../package.json';

const images = path.resolve(__dirname, '../src/images');
const lib = path.resolve(__dirname, '../lib');

// copy images
fs.copySync(images, path.join(lib, 'images'));

// copy readme
fs.copySync('README.md', path.join(lib, 'README.md'));

// edit package json and copy
packageJson.main = 'index.js';
fs.writeFileSync('./lib/package.json', JSON.stringify(packageJson, null, 4));
