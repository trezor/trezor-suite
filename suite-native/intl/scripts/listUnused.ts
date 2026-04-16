/* eslint-disable no-console */
import { execSync } from 'child_process';
import path from 'path';

import { getGrepCommandOfTranslationKey } from '@suite-common/suite-utils';

import { writeMessagesObjectToFile } from './utils';
import { messages } from '../src/messages';
import { deleteNestedTranslationKey, flatten } from '../src/utils';

const suiteNativeRoot = path.join(__dirname, '..', '..');
const messagesPath = path.join(suiteNativeRoot, 'intl', 'src', 'messages.ts');

function execLocal(cmd: string) {
    return execSync(cmd, {
        encoding: 'utf-8',
        cwd: suiteNativeRoot,
    });
}

const unused: string[] = [];

const flatMessages = flatten(messages);
const numberOfMessages = Object.keys(flatMessages).length;

console.log('Looking up for unused translation keys... 🔎');

const messageKeys = Object.keys(flatMessages);

for (let i = 0; i < numberOfMessages; i++) {
    const message = messageKeys[i];
    if (message === undefined) continue;
    process.stdout.write(`\r\x1b[KProcessing translation ${i}/${numberOfMessages}: ${message}`);

    if (Object.prototype.hasOwnProperty.call(flatMessages, message)) {
        const cmd = getGrepCommandOfTranslationKey(message);

        try {
            execLocal(cmd);
        } catch {
            unused.push(message);
        }
    }
}

if (unused.length > 0) {
    console.log('\n');
    for (const unusedId of unused) {
        console.log(unusedId);
    }
    console.log(`${unused.length} unused messages found. ⚠️`);

    if (process.argv.includes('--cleanup')) {
        console.log('cleaning up unused translation keys...');

        for (const unusedId of unused) {
            deleteNestedTranslationKey(messages, unusedId);
        }
        writeMessagesObjectToFile(messages, messagesPath);
        execLocal(`yarn prettier --write ${messagesPath}`);
        console.log('Unused translation keys cleaned up! 🎉');
    } else {
        process.exit(1);
    }
} else {
    console.log('No unused translation keys found! 🎉');
}
