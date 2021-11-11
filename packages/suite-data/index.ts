import * as fs from 'fs-extra';
import * as rm from 'rimraf';
import { resolve, join } from 'path';

const config = {
    'suite-desktop': ['bin', 'fonts', 'images', 'message-system', 'videos'],
    'suite-native': ['fonts', 'images', 'message-system', 'videos'],
    'suite-web': ['browser-detection', 'fonts', 'images', 'message-system', 'oauth', 'videos'],
    'suite-web-landing': ['fonts', 'images/icons/favicon', 'images/suite-web-landing'],
};

Object.entries(config).forEach(([project, paths]) => {
    const destination = join(resolve(__dirname, '../'), project, 'public');
    rm.sync(destination);
    paths.forEach(path => {
        const from = join(resolve(__dirname), 'files', path);
        const to = join(destination, 'static', path);
        fs.copy(from, to, err => {
            if (err) {
                console.error(err);
                process.exit(1);
            }
            console.log('copied', from, to);
        });
    });
});
