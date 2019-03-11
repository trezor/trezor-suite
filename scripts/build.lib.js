import fs from 'fs-extra';
import { resolve } from 'path';
import { collectImportsSync } from 'babel-collect-imports';
import packageJSON from '../package.json';

const { internal } = collectImportsSync(resolve(__dirname, '../src/index.js'));

const src = resolve(__dirname, '../src');
const npm = resolve(__dirname, '../build');
const lib = resolve(__dirname, '../build/lib');

internal.forEach(file => {
    const libFile = file.replace(src, lib);
    fs.copySync(file, libFile);
    fs.copySync(file, libFile + '.flow');
});

delete packageJSON.devDependencies;
delete packageJSON.scripts;
delete packageJSON.bin;

packageJSON.main = 'lib/index.js';
fs.writeFileSync(resolve(npm, 'package.json'), JSON.stringify(packageJSON, null, '  '), 'utf-8');

fs.copySync(resolve(npm, '../README.md'), resolve(npm, 'README.md'));
fs.copySync(resolve(npm, '../LICENSE.md'), resolve(npm, 'LICENSE.md'));
fs.copySync(resolve(npm, '../CHANGELOG.md'), resolve(npm, 'CHANGELOG.md'));
fs.copySync(resolve(src, 'utils/ws.js'), resolve(lib, 'utils/ws.js'));