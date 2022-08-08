/* eslint-disable no-restricted-syntax */
/* eslint-disable no-continue */

import { execSync } from 'child_process';
import path from 'path';
import messages from '@trezor/suite/src/support/messages';

console.log('unused messages: ');

const unused: string[] = [];

for (const message in messages) {
    if (Object.prototype.hasOwnProperty.call(messages, message)) {
        // some messages might be 'dynamic' which means they are not present
        // in the codebase but their identifiers are returned from some API server instead
        if (messages[message].dynamic) {
            continue;
        }

        const ignore = [
            'docs',
            'node_modules',
            'lib',
            'libDev',
            'build',
            'build-electron',
            '.next',
            '__fixtures__',
            'test',
            'tests',
            '__test__',
            '__tests__',
            'coverage',
            '.git',
            'suite-data',
            'integration-tests',
            'connect-common',
        ];

        try {
            execSync(
                `grep ${ignore
                    .map(folder => `--exclude-dir="${folder}"`)
                    .join(' ')} --exclude=messages.ts -r "${message}" ./`,
                {
                    encoding: 'utf-8',
                    cwd: path.join(__dirname, '..', '..', '..', '..'),
                },
            );
        } catch (err) {
            console.log(message);
            unused.push(message);
        }
    }
}

if (unused.length) {
    console.log('there are unused messages!');
    process.exit(1);
}
