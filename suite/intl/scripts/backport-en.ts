/**
 * This script takes latest en-US.json and creates new file messages.ts
 *
 * Problem ?
 * - messages.ts is created by developers using "developers English" which might be miles away from proper English
 * - en-US.json is proper English translation by proper translators
 * - en-US.json is also used by product team to modify meaning of the texts sometimes
 * - when meaning in en-US.json is different from messages.ts (source strings) it might cause meaning divergence between translations to other languages
 *
 * Solution ?
 * - backport proper English from en-US.json to messages.ts
 */

import fs from 'fs';
import path from 'path';

import { typedObjectKeys } from '@trezor/utils';

import { messages } from '../src/messages';

const root = path.join(__dirname, '../../../');
const targetPath = path.join(root, 'suite/intl/src/messages.ts');
const sourcePath = path.join(root, 'packages/suite-data/files/translations/en-US.json');

const source: Record<string, string> = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

typedObjectKeys(messages).forEach(key => {
    const override = source[key];
    if (override === undefined) {
        return;
    }

    // defaultMessage is literal-typed; widen to string for the in-place rewrite.
    (messages[key] as { defaultMessage: string }).defaultMessage = override.replace(/\n$/, '');
});

fs.writeFileSync(
    targetPath,
    `
import { defineMessages } from 'react-intl';

export const messages = defineMessages(${JSON.stringify(messages, null, 2).replace(/"([^"]+)":/g, '$1:')} as const)

`,
);

export {};
