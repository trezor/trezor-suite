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

import { messages } from '../src/messages';
import { deepMerge, unflatten } from '../src/utils';

const source: { [key in keyof typeof messages]: string } = JSON.parse(
    fs.readFileSync('translations/en-US.json', 'utf8'),
);

const unflattenedSource = unflatten(source);
const updatedMessages = deepMerge(messages, unflattenedSource);

fs.writeFileSync(
    'src/messages.ts',
    `
    // Few rules:
    // 1. Never use dynamic keys IDs for example: translate(\`module.graph.coin.\${symbol}\`) instead map it to static key: { btc: translate('module.graph.coin.btc') }
    // 2. Don't split string because of formatting or nested components use Rich Text Formatting instead https://formatjs.io/docs/react-intl/components#rich-text-formatting
    // 3. Always wrap keys per module/screen/feature for example: module.graph.legend
    
    export const messages = ${JSON.stringify(updatedMessages, null, 2)};`,
);
