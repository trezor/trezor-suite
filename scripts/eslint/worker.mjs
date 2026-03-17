import { exec } from 'node:child_process';
import { parentPort, threadId } from 'node:worker_threads';

import { lintErrorMessage, lintMessageTypes, lintSuccessMessage } from './messages.mjs';

function lintWorkspace(workspaceName, eslintArgs) {
    const workspacePath = `./${workspaceName}`;
    console.log(`${String(threadId).padStart(2, '0')}: ⏳ Linting ${workspaceName}`);

    const command = `yarn g:eslint ${workspacePath} ${eslintArgs.join(' ')}`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            parentPort.postMessage(lintErrorMessage(`${error.message} ${stdout} ${stderr}`));
        } else {
            parentPort.postMessage(lintSuccessMessage());
        }
    });
}

parentPort.on('message', message => {
    switch (message.type) {
        case lintMessageTypes.LINT:
            lintWorkspace(message.workspace, message.eslintArgs);
            break;
        default:
            lintErrorMessage(`Unknown message type: ${message.type}`);
    }
});

parentPort.on('error', error => {
    console.error(threadId, 'Worker error:', error);
    process.exit(1);
});

parentPort.on('close', () => {
    console.log(threadId, 'Worker closed');
});
