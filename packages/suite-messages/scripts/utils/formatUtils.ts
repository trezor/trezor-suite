import { A, D, pipe } from '@mobily/ts-belt';
import prettier from 'prettier';
import { SimpleMessagesObject } from '../../src/messages';

export const sortMessages = (messages: SimpleMessagesObject<string>) =>
    pipe(
        messages,
        D.toPairs,
        A.sort(([messageIdA], [messageIdB]) => {
            if (messageIdA < messageIdB) {
                return -1;
            }
            if (messageIdA > messageIdB) {
                return 1;
            }
            return 0;
        }),
        D.fromPairs,
    );

export const serializeMessages = (messages: SimpleMessagesObject<string>) =>
    JSON.stringify(messages).replace(/\\\\/g, '/');

export const formatAndSortMessages = async (messages: SimpleMessagesObject<string>) => {
    const prettierConfigPath = await prettier.resolveConfigFile();
    const prettierConfig = {
        ...(await prettier.resolveConfig(prettierConfigPath!)),
        parser: 'json',
    };

    const sortedMessages = sortMessages(messages);

    return prettier.format(serializeMessages(sortedMessages), prettierConfig);
};
