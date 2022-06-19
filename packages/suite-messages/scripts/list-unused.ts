/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-continue */

import { D } from '@mobily/ts-belt';
import chalk from 'chalk';
import { spawnSync } from 'child_process';
import { messageFiles, sharedMessagesFile } from './utils/messagesFiles';

let anyUnusedFound = false;

const checkIfMessageKeyIsUnused = (messageId: string, messageDomain: string, path: string) => {
    const { stdout, error } = spawnSync(
        'bash',
        ['suite-messages/scripts/find-unused.sh', path, messageId],
        {
            encoding: 'utf-8',
            cwd: '../',
        },
    );

    if (error) {
        console.log(error);
        console.log(chalk.red.bold('Something went wrong during bash find command call.'));
        process.exit(1);
    }

    if (!stdout) {
        console.log(
            chalk.red(
                `Unused message ${chalk.bold(messageId)} in file ${chalk.bold(
                    `${messageDomain}Message.json`,
                )}`,
            ),
        );
        anyUnusedFound = true;
    }
};

const allMessageFiles = {
    ...messageFiles,
    shared: sharedMessagesFile,
};

D.toPairs(allMessageFiles).forEach(([messagesDomain, messagesPaths]) => {
    const messageKeys = D.keys(messagesPaths.sourceMessages);
    messageKeys.forEach(messageKey => {
        checkIfMessageKeyIsUnused(messageKey, messagesDomain, messagesPaths.unusedPathPattern);
    });
});

if (anyUnusedFound) {
    process.exit(1);
}

console.log(chalk.green('No unused message IDs found. Hurray!'));
