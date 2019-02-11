import { collectImportsSync } from 'babel-collect-imports';
import fs from 'fs-extra';
import packageJSON from '../package.json';
import path from 'path';

const { internal } = collectImportsSync(path.resolve(__dirname, '../src/index.js'));

const src = path.resolve(__dirname, '../src');
const npm = path.resolve(__dirname, '../npm');
const lib = path.resolve(__dirname, '../npm/lib');

internal.forEach((file) => {
    const libFile = file.replace(src, lib);
    fs.copySync(file, libFile);
    fs.copySync(file, `${libFile  }.flow`);
});

delete packageJSON.devDependencies;
delete packageJSON.scripts;
delete packageJSON.dependencies['@storybook/react'];
delete packageJSON.dependencies['storybook-addon-jsx'];
delete packageJSON.dependencies.react;
delete packageJSON.dependencies['react-dom'];
delete packageJSON.dependencies.redux;

packageJSON.dependencies = {
    ...packageJSON.dependencies,
    ...packageJSON.npmDependencies,
};
delete packageJSON.npmDependencies;

packageJSON.main = 'lib/index.js';
fs.writeFileSync(path.resolve(npm, 'package.json'), JSON.stringify(packageJSON, null, '  '), 'utf-8');
