/* eslint-disable global-require */
/**
 * This script takes latest en.json and updates messages
 * Problem ?
 * - messages(*).json is created by developers using "developers English" which might be miles away from proper English
 * - en.json is proper English translation by proper translators
 * - en.json is also used by product team to modify meaning of the texts sometimes
 * - when meaning in en.json is different from messages.ts (source strings) it might cause meaning divergence between translations to other languages
 *
 * Solution ?
 * - backport proper English from en.json to messages(*).json
 */

import { D } from '@mobily/ts-belt';
import fs from 'fs';

import { formatAndSortMessages } from './utils/formatUtils';
import { messageFiles, MessagesPaths, sharedMessagesFile } from './utils/messagesFiles';

const backportEn = async ({
    sourceMessages,
    sourceMessagesPath,
    translatedMessages,
}: MessagesPaths) => {
    const sourceMessagesKeys = D.keys(sourceMessages);
    const updatedTranslateMessages = D.selectKeys(translatedMessages, sourceMessagesKeys);
    const newSourceMessages = { ...sourceMessages, ...updatedTranslateMessages };

    fs.writeFileSync(sourceMessagesPath, await formatAndSortMessages(newSourceMessages));
};

D.values(messageFiles).forEach(async messagesPaths => {
    await backportEn(messagesPaths);
    await backportEn({ ...messagesPaths, ...sharedMessagesFile });
});

export {};
