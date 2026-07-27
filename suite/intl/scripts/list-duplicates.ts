/* eslint-disable no-console */
import { typedObjectEntries, typedObjectValues } from '@trezor/utils';

import { messages } from '../src/messages';

const ids: Record<string, number> = {};
const defaultMessages: Record<string, number> = {};

typedObjectValues(messages).forEach(({ id, defaultMessage }) => {
    ids[id] = (ids[id] ?? 0) + 1;
    defaultMessages[defaultMessage] = (defaultMessages[defaultMessage] ?? 0) + 1;
});

const getDuplicates = (counts: Record<string, number>) =>
    typedObjectEntries(counts)
        .filter(([, value]) => value > 1)
        .map(([key, value]) => ({ value: key, occurrences: value }));

const duplicatedIds = getDuplicates(ids);

if (duplicatedIds.length) {
    console.log('There are duplicated ids.');
    console.log(duplicatedIds);
    process.exit(1);
}

console.log(getDuplicates(defaultMessages));

process.exit(0);
