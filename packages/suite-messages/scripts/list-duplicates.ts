import { messages } from '../src/messages';

const ids: Record<string, any> = {};
const defaultMessages: Record<string, any> = {};

type MessageKeys = keyof typeof messages;

Object.keys(messages).forEach((untypedKey: any) => {
    const key: MessageKeys = untypedKey;
    if (!ids[messages[key].id]) {
        ids[messages[key].id] = 0;
    }
    ids[messages[key].id] += 1;

    if (!defaultMessages[messages[key].defaultMessage]) {
        defaultMessages[messages[key].defaultMessage] = 0;
    }
    defaultMessages[messages[key].defaultMessage] += 1;
});

const getDuplicates = (obj: Record<string, number>) =>
    Object.entries(obj)
        .filter(([_, value]) => value > 1)
        .map(([key, value]) => ({ value: key, occurrences: value }));

const duplicatedIds = getDuplicates(ids);

if (duplicatedIds.length) {
    console.log('There are duplicated ids.');
    console.log(duplicatedIds);
    process.exit(1);
}

console.log(getDuplicates(defaultMessages));

process.exit(0);
