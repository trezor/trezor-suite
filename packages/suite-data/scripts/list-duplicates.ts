import messages from '../../suite/src/support/messages';

type Message = {
    [key: string]: {
        id: string;
        defaultMessage: string;
    };
};

const ids = {};
const defaultMessages = {};

Object.keys(messages as unknown as Message[]).forEach((key: string) => {
    if (!ids[messages[key].id]) {
        ids[messages[key].id] = 0;
    }
    ids[messages[key].id] += 1;

    if (!defaultMessages[messages[key].defaultMessage]) {
        defaultMessages[messages[key].defaultMessage] = 0;
    }
    defaultMessages[messages[key].defaultMessage] += 1;
});

const getDuplicates = obj =>
    Object.entries(obj as Record<string, number>)
        .filter(([key, value]) => value > 1)
        .map(([key, value]) => ({ value: key, occurrences: value }));

const duplicatedIds = getDuplicates(ids);

if (duplicatedIds.length) {
    console.log('There are duplicated ids.');
    console.log(duplicatedIds);
    process.exit(1);
}

console.log(getDuplicates(defaultMessages));

process.exit(0);
