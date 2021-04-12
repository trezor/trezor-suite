import fs from 'fs-extra';
import path from 'path';
import { collectImportsSync } from 'babel-collect-imports';
import packageJSON from '../package.json';

const src = path.resolve(__dirname, '../src');
const npm = path.resolve(__dirname, '../build');
const lib = path.resolve(__dirname, '../build/lib');

const buildWorker = entry => {
    const { internal } = collectImportsSync(path.resolve(__dirname, entry));
    internal.forEach(file => {
        const libFile = file.replace(src, lib);
        fs.copySync(file, libFile);
        fs.copySync(file, libFile + '.flow');
    });
};

const workers = [
    '../src/workers/ripple/index.js',
    '../src/workers/blockbook/index.js',
    '../src/workers/blockfrost/index.js',
];

workers.forEach(w => {
    buildWorker(w);
});

delete packageJSON.devDependencies;
delete packageJSON.scripts;
delete packageJSON.bin;

packageJSON.main = 'lib/index.js';
fs.writeFileSync(
    path.resolve(npm, 'package.json'),
    JSON.stringify(packageJSON, null, '  '),
    'utf-8'
);

fs.copySync(path.resolve(npm, '../README.md'), path.resolve(npm, 'README.md'));
fs.copySync(path.resolve(npm, '../LICENSE.md'), path.resolve(npm, 'LICENSE.md'));
fs.copySync(path.resolve(npm, '../CHANGELOG.md'), path.resolve(npm, 'CHANGELOG.md'));
