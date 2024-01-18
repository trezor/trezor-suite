/* eslint-disable no-restricted-syntax */
/* eslint-disable no-continue */

import { execSync } from 'child_process';
import path from 'path';

// See comment in list-duplicates.ts
// eslint-disable-next-line import/no-extraneous-dependencies
import messages from '@trezor/suite/src/support/messages';

console.log('unused messages: ');

const unused: string[] = [];

const ignore = [
    'docs',
    'node_modules',
    'lib',
    'libDev',
    'build',
    'build-electron',
    '.next',
    '__fixtures__',
    'fixtures',
    'test',
    'tests',
    '__test__',
    '__tests__',
    'coverage',
    '.git',
    'suite-data',
    'connect-common',
    '.yarn',
    'screenshots',
    'e2e',
];

const extensions = ['.ts', '.tsx'];

for (const message in messages) {
    if (Object.prototype.hasOwnProperty.call(messages, message)) {
        // some messages might be 'dynamic' which means they are not present
        // in the codebase but their identifiers are returned from some API server instead
        if (messages[message].dynamic) {
            continue;
        }

        const includeExtensions = extensions
            .map(extension => `--include="*${extension}"`)
            .join(' ');
        const excludeDir = ignore.map(folder => `--exclude-dir="${folder}"`).join(' ');

        const cmd = `grep ${includeExtensions} ${excludeDir} --exclude=messages.ts -r "${message}" -w ./`;

        try {
            execSync(cmd, {
                encoding: 'utf-8',
                cwd: path.join(__dirname, '..', '..', '..', '..'),
            });
        } catch (err) {
            unused.push(message);
        }
    }
}

if (unused.length) {
    console.log('there are unused messages!');
    console.log(unused);
    process.exit(1);
}
