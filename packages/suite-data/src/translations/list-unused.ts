/* eslint-disable no-restricted-syntax */
/* eslint-disable no-continue */

import { spawnSync } from 'child_process';
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

        // list of patterns to search
        const path = '**/(suite|validation)*/**';
        // possible paths:
        // suite, suite-desktop, suite-web
        // 'suite-web-landing/components',
        // 'suite-web-landing/pages',
        // 'suite-web-landing/scripts',
        // 'suite-web-landing/utils',

        const { stdout } = spawnSync(
            'bash',
            ['suite-data/src/translations/find-unused.sh', path, message],
            {
                encoding: 'utf-8',
                cwd: '../',
            },
        );

        if (!stdout) {
            console.log(message);
            unused.push(message);
        }
    }
}

if (unused.length) {
    console.log('there are unused messages!');
    process.exit(1);
}
