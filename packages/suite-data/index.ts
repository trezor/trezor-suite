import config from './config';
import * as fs from 'fs-extra';
import { resolve, join } from 'path';

const projectRoot = resolve(__dirname);
const packagesRoot = resolve(projectRoot, '../');

const paths = {
    web: join(packagesRoot, 'suite-web', 'static'),
    desktop: join(packagesRoot, 'suite-desktop', 'static'),
    native: join(packagesRoot, 'suite-native', 'static'),
};

const copyFiles = (from: string, to: string) => {
    fs.copy(from, to, err => {
        if (err) return console.error(err);
        console.log('copied', from, to);
    });
};

Object.keys(config).map((project: string) => {
    switch (project) {
        case 'web':
            config[project].map(path => copyFiles(join(projectRoot, path), join(paths.web, path)));
            break;
        case 'desktop':
            config[project].map(path =>
                copyFiles(join(projectRoot, path), join(paths.desktop, path)),
            );
            break;
        case 'native':
            config[project].map(path =>
                copyFiles(join(projectRoot, path), join(paths.native, path)),
            );
            break;
        default:
            console.log('Unknown option in data config');
    }
});
