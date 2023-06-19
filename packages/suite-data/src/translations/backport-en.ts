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

// See comment in list-duplicates.ts
// eslint-disable-next-line import/no-extraneous-dependencies
import messages from '@trezor/suite/src/support/messages';

const packagesRoot = path.join(__dirname, '../../../');
const targetPath = path.join(packagesRoot, 'suite/src/support/messages.ts');
const sourcePath = path.join(packagesRoot, 'suite-data/files/translations/en.json');

const source: { [key in keyof typeof messages]: string } = JSON.parse(
    fs.readFileSync(sourcePath, 'utf8'),
);

Object.entries(source).forEach(([key, value]) => {
    if (!messages[key]) {
        return;
    }

    messages[key].defaultMessage = value.replace(/\n$/, '');
});

fs.writeFileSync(
    targetPath,
    `
import { defineMessages } from 'react-intl';

export default defineMessages(${JSON.stringify(messages, null, 2).replace(/"([^"]+)":/g, '$1:')})

`,
);

export {};
