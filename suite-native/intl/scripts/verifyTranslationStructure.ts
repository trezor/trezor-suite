/* eslint-disable no-console */
// Guards against translation key structure collisions that break Crowdin sync.
//
// Crowdin treats a dot-joined key as a nested tree, so a path is either a string or an object,
// never both. Reshaping an existing key (e.g. "cancel" -> "cancel.ios" or vice versa) collides with what Crowdin
// holds. messages.ts is checked against en-US.json (the in-repo Crowdin baseline) to also catch
// keys removed from messages.ts but still live on Crowdin.
import fs from 'fs';

import { messages } from '../src/messages';
import { findTranslationStructureCollisions, flatten } from '../src/utils';

const messagesFlatKeys = Object.keys(flatten(messages));
const baselineFlatKeys = Object.keys(
    JSON.parse(fs.readFileSync('translations/en-US.json', 'utf8')),
);

const messagesKeySet = new Set(messagesFlatKeys);
const baselineKeySet = new Set(baselineFlatKeys);

const sourceOf = (key: string) => {
    const inMessages = messagesKeySet.has(key);
    const inBaseline = baselineKeySet.has(key);
    if (inMessages && inBaseline) return 'messages.ts + Crowdin';
    if (inMessages) return 'messages.ts';

    return 'Crowdin (en-US.json)';
};

const collisions = findTranslationStructureCollisions(messagesFlatKeys, baselineFlatKeys);

if (collisions.length > 0) {
    console.error(`❌ Found ${collisions.length} translation key structure collision(s).\n`);
    console.error(
        'A key path cannot be both a string and an object at once. Each collision below shows a',
    );
    console.error('key used as a string while another key nests beneath it:\n');

    for (const { current, baseline } of collisions) {
        console.error(`  • string:  ${current}  (in ${sourceOf(current)})`);
        console.error(`    nested:  ${baseline}  (in ${sourceOf(baseline)})\n`);
    }

    console.error('How to fix: rename one side to a fresh key path so they no longer overlap;');
    console.error('do not change an existing key between a string and an object.');
    process.exit(1);
} else {
    console.log('✅ No translation key structure collisions found.');
}
