// @trezor/suite-data -> @trezor/suite -> @trezor/suite-data
// this is causing module cyclic dependency!!! it will work since this dep is not specified
// in package.json or refs, and also these files must be excluded from TS check
// TODO: intl or scripts should have dedicated package on that could both suite-data and suite depends
// eslint-disable-next-line import/no-extraneous-dependencies
import messages from '@trezor/suite/src/support/messages';

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
