/* eslint-disable no-console */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

import { findUsedTranslationKeys } from './findUsedTranslationKeys';
import { messages } from '../src/messages';

console.log('unused messages: ');

const rootDir = path.join(__dirname, '..', '..', '..');

function execLocal(cmd: string) {
    return execSync(cmd, {
        encoding: 'utf-8',
        cwd: rootDir,
    });
}

// Dynamic messages have no literal key in the codebase – their identifiers come
// from an API server at runtime, so grep can't find them and they'd be reported
// as false positives.
const searchableKeys = Object.entries(messages)
    .filter(([, definition]) => !(definition as { dynamic?: boolean }).dynamic)
    .map(([key]) => key);

const usedKeys = findUsedTranslationKeys(searchableKeys, rootDir);

const unused = searchableKeys.filter(key => !usedKeys.has(key));

if (unused.length) {
    console.log('there are unused messages:');
    for (const message of unused) {
        console.log(message);
    }

    if (process.argv.includes('--cleanup')) {
        console.log('cleaning up...');
        const pathToMessages = path.join(__dirname, '..', 'src', 'messages.ts');
        let messagesContent = fs.readFileSync(pathToMessages, 'utf-8');

        for (const message of unused) {
            const regex = new RegExp(`\\s+${message}:\\s+\\{[\\s\\S]*?\\},?\\n`, 'g');
            messagesContent = messagesContent.replace(regex, '');
        }
        fs.writeFileSync(pathToMessages, messagesContent);
        execLocal(`yarn prettier --write ${pathToMessages}`);

        if (process.argv.includes('--pr')) {
            // Create a PR
            console.log('creating PR...');
            const dateCode = new Date()
                .toISOString()
                .replace(/[^0-9]/g, '')
                .slice(0, 12);
            const branchName = 'chore/remove-unused-messages-' + dateCode;
            const title = 'chore(suite-data): remove unused messages';
            const body = 'This PR removes unused localization messages from Suite';
            execLocal(`git checkout -b ${branchName}`);
            execLocal(`git add ${pathToMessages}`);
            execLocal(`git commit -m "${title}"`);
            execLocal(`git push origin ${branchName}`);
            execLocal(
                `gh pr create --repo trezor/trezor-suite --title "${title}" --body "${body}" --base develop --head ${branchName}`,
            );
        }
    } else {
        process.exit(1);
    }
}
