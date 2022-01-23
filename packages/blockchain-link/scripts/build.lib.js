// const fs = require('fs');
// const path = require('path');

// fs.copyFile(path.resolve(__dirname, '../src/utils/ws.js'), path.resolve(__dirname, '../lib/utils/ws.js'), () => {});

// import fs from 'fs'; // lint-disable-line import/no-extraneous-dependencies
// import { resolve } from 'path';
// import packageJSON from '../package.json';

// const { internal } = collectImportsSync(resolve(__dirname, '../src/index.js'));

// const src = resolve(__dirname, '../src');
// const npm = resolve(__dirname, '../');
// const lib = resolve(__dirname, '../lib');

// try {
//     fs.remove(lib);
// } catch (err) {}

// const ignore = ['.DS_Store', 'ui', '_old', 'ws.js'];

// const copySrc = dir => {
//     const files = fs.readdirSync(dir, 'utf8');
//     for (const file of files) {
//         if (ignore.indexOf(file) < 0) {
//             const filePath = resolve(dir, file);
//             if (fs.statSync(filePath).isDirectory()) {
//                 copySrc(filePath);
//             } else {
//                 const libFile = filePath.replace(src, lib);
//                 fs.copySync(filePath, libFile);
//                 fs.copySync(filePath, `${libFile}.flow`);
//             }
//         }
//     }
// };

// copySrc(src);

// delete packageJSON.devDependencies;
// delete packageJSON.scripts;
// delete packageJSON.bin;

// packageJSON.main = 'lib/index.js';
// fs.writeFileSync(resolve(npm, 'package.json'), JSON.stringify(packageJSON, null, '  '), 'utf-8');

// fs.copySync(resolve(npm, '../README.md'), resolve(npm, 'README.md'));
// fs.copySync(resolve(npm, '../LICENSE.md'), resolve(npm, 'LICENSE.md'));
// fs.copySync(resolve(npm, '../CHANGELOG.md'), resolve(npm, 'CHANGELOG.md'));
// fs.copySync(resolve(src, 'utils/ws.js'), resolve(lib, 'utils/ws.js'));
