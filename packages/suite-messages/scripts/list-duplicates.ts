/*
This script will check if there are no same message IDs in both
*/

import { A, D } from '@mobily/ts-belt';
import chalk from 'chalk';

import { MessagesDomain, SimpleMessagesObject } from '../src';
import { messageFiles, sharedMessagesFile } from './utils/messagesFiles';

let anyDuplicatedKeyFound = false;

const checkDuplicateMessagesIds = (
    messages: SimpleMessagesObject<string>,
    messagesDomain: MessagesDomain,
) => {
    const sharedMessagesKeys = D.keys(sharedMessagesFile.sourceMessages);
    D.keys(messages).forEach(messageId => {
        if (A.includes(sharedMessagesKeys, messageId)) {
            console.log(
                chalk.red(
                    `Message with id ${chalk.bold(messageId)} is duplicated in ${chalk.bold(
                        'sharedMessages.json',
                    )} and ${chalk.bold(`${messagesDomain}Messages.json`)}`,
                ),
            );
            anyDuplicatedKeyFound = true;
        }
    });
};

D.toPairs(messageFiles).forEach(([messagesDomain, messagesPaths]) => {
    checkDuplicateMessagesIds(messagesPaths.sourceMessages, messagesDomain);
});

if (anyDuplicatedKeyFound) {
    process.exit(1);
} else {
    console.log(chalk.green('No duplicated message IDs found. Hurray!'));
    process.exit(0);
}
