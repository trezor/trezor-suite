/**
 * This script takes latest en.json and creates new file messages.ts
 *
 * Problem ?
 * - messages.ts is created by developers using "developers English" which might be miles away from proper English
 * - en.json is proper English translation by proper translators
 * - en.json is also used by product team to modify meaning of the texts sometimes
 * - when meaning in en.json is different from messages.ts (source strings) it might cause meaning divergence between translations to other languages
 *
 * Solution ?
 * - backport proper English from en.json to messages.ts
 */

import fs from 'fs';
import path from 'path';

import { messages } from '../src/messages';

const targetPath = path.join(__dirname, '../src/messages.ts');
const sourcePath = path.join(__dirname, '../../suite-data/files/translations/en.json');

const sharedMessagesPath = path.join(__dirname, '../src/sharedMessages.json');

const messagesFiles = [
    {
        targetPath: path.join(__dirname, '../src/webMessages.json'),
        sourcePath: path.join(__dirname, '../translations/web/en.json'),
    },
    {
        targetPath: path.join(__dirname, '../src/mobileMessages.json'),
        sourcePath: path.join(__dirname, '../translations/mobile/en.json'),
    },
];

const source: { [key in keyof typeof messages]: string } = JSON.parse(
    fs.readFileSync(sourcePath, 'utf8'),
);

Object.entries(source).forEach(([key, value]) => {
    // @ts-ignore
    if (!messages[key]) {
        return;
    }

    // @ts-ignore remove line break from the end of string. probably translators accident;
    messages[key].defaultMessage = value.replace(/\n$/, '');
});

fs.writeFileSync(
    targetPath,
    `
import { defineMessages } from 'react-intl';

export const messages = defineMessages(${JSON.stringify(messages, null, 2).replace(
        /"([^"]+)":/g,
        '$1:',
    )})

`,
);

export {};
