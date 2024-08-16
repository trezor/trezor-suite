import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

// See comment in list-duplicates.ts
// eslint-disable-next-line import/no-extraneous-dependencies
import messages from '@trezor/suite/src/support/messages';

console.log('unused messages: ');

const rootDir = path.join(__dirname, '..', '..', '..', '..');
function execLocal(cmd: string) {
    return execSync(cmd, {
        encoding: 'utf-8',
        cwd: rootDir,
    });
}

const unused: string[] = [];

const ignore = [
    'docs',
    'node_modules',
    'lib',
    'libDev',
    'build',
    'build-electron',
    '.next',
    '__fixtures__',
    'fixtures',
    'test',
    'tests',
    '__test__',
    '__tests__',
    'coverage',
    '.git',
    'suite-data',
    'connect-common',
    '.yarn',
    'screenshots',
    'e2e',
];

const extensions = ['.ts', '.tsx'];

for (const message in messages) {
    if (Object.prototype.hasOwnProperty.call(messages, message)) {
        // some messages might be 'dynamic' which means they are not present
        // in the codebase but their identifiers are returned from some API server instead
        if (messages[message].dynamic) {
            continue;
        }

        const includeExtensions = extensions
            .map(extension => `--include="*${extension}"`)
            .join(' ');
        const excludeDir = ignore.map(folder => `--exclude-dir="${folder}"`).join(' ');

        const cmd = `grep ${includeExtensions} ${excludeDir} --exclude=messages.ts -r "${message}" -w ./`;

        try {
            execLocal(cmd);
        } catch (err) {
            unused.push(message);
        }
    }
}

if (unused.length) {
    console.log('there are unused messages:');
    for (const message of unused) {
        console.log(message);
    }

    if (process.argv.includes('--cleanup')) {
        console.log('cleaning up...');
        const pathToMessages = path.join(
            __dirname,
            '..',
            '..',
            '..',
            'suite',
            'src',
            'support',
            'messages.ts',
        );
        let messagesContent = fs.readFileSync(pathToMessages, 'utf-8');

        for (const message of unused) {
            const regex = new RegExp(`\\s+${message}:\\s+\\{[^}]*\\},?\\n`, 'g');
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
