// eslint-disable-next-line import/no-extraneous-dependencies
import fs from 'fs-extra';
import path from 'path';

const images = path.resolve(__dirname, '../src/images');
const lib = path.resolve(__dirname, '../lib');

fs.copySync(images, path.join(lib, 'images'));
