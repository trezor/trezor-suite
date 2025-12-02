/**
 * This script takes latest en-US.json and creates new file messages.ts
 *
 * Problem ?
 * - messages.ts might not reflect the final version of the translations, because copy writers are able to modify the english strings in Crowdin.
 * - en-US.json is up to date English translations that can change over time.
 * - when meaning in en-US.json is different from messages.ts (source strings) it might cause meaning divergence between translations to other languages
 *
 * Solution ?
 * - backport proper English from en-US.json to messages.ts
 */

import fs from 'fs';
import path from 'path';

import { mergeDeepObject } from '@trezor/utils';

import { writeMessagesObjectToFile } from './utils';
import { messages } from '../src/messages';
import { unflatten } from '../src/utils';

const source: { [key in keyof typeof messages]: string } = JSON.parse(
    fs.readFileSync('translations/en-US.json', 'utf8'),
);

const unflattenedSource = unflatten(source);
const updatedMessages = mergeDeepObject(messages, unflattenedSource);

const messagesPath = path.join(__dirname, '..', '..', 'intl', 'src', 'messages.ts');

writeMessagesObjectToFile(updatedMessages, messagesPath);
