/* eslint-disable no-console */
import { execSync } from 'child_process';
import path from 'path';

import { findUsedTranslationKeys } from './findUsedTranslationKeys';
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

console.log('Looking up for unused translation keys... 🔎');

const messageKeys = Object.keys(flatten(messages));
const usedKeys = findUsedTranslationKeys(messageKeys, suiteNativeRoot);
const unused = messageKeys.filter(key => !usedKeys.has(key));

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
