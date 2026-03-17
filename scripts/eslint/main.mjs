import { execSync } from 'node:child_process';
import { cpus } from 'node:os';
import { Worker } from 'node:worker_threads';

import { lintMessage, lintMessageTypes } from './messages.mjs';

const eslintArgs = process.argv.slice(2);
const BLACKLISTED_WORKSPACES = new Set(['scripts', '.']);

function getWorkspaces() {
    const workspacesRaw = execSync('yarn workspaces list --json', { encoding: 'utf8' });

    return workspacesRaw
        .trim()
        .split('\n')
        .map(line => JSON.parse(line).location)
        .filter(location => !BLACKLISTED_WORKSPACES.has(location));
}

async function main() {
    const workspaces = getWorkspaces();
    const totalWorkspaces = workspaces.length;
    const coreCount = cpus().length - 1;

    /**
     * @type {Promise<void>[]}
     */
    const activeTasks = [];

    console.log(`🔍 Found ${totalWorkspaces} workspaces. Spawning ${coreCount} workers.`);

    const workers = new Array(coreCount).fill(0).map(() => ({
        status: 'idle',
        worker: new Worker(new URL('./worker.mjs', import.meta.url)),
    }));

    let finishedWorkspaces = 0;

    while (workspaces.length) {
        const workspace = workspaces.pop();

        if (!workspace) {
            break;
        }

        let worker = workers.find(worker => worker.status === 'idle');

        // If there's no free worker, wait for one to finish its current task
        while (!worker) {
            await Promise.race(activeTasks);
            worker = workers.find(worker => worker.status === 'idle');
        }

        const taskPromise = new Promise((resolve, reject) => {
            worker.worker.once('message', message => {
                worker.status = 'idle';

                switch (message.type) {
                    case lintMessageTypes.LINT_SUCCESS:
                        finishedWorkspaces++;
                        console.log(
                            `${String(worker.worker.threadId).padStart(2, '0')}: 🟢 ${workspace} linted (${finishedWorkspaces}/${totalWorkspaces})`,
                        );
                        resolve();
                        break;
                    case lintMessageTypes.LINT_ERROR:
                        reject(message.error);
                        break;
                }
            });
        });

        activeTasks[worker.worker.threadId - 1] = taskPromise;
        worker.status = 'busy';
        worker.worker.postMessage(lintMessage(workspace, eslintArgs));
    }

    await Promise.all(activeTasks);
    activeTasks.splice(0, activeTasks.length);
    await Promise.all(workers.map(worker => worker.worker.terminate()));
}

main()
    .then(() => {
        console.log('✅ All workspaces linted successfully');
        process.exit(0);
    })
    .catch(err => {
        console.error('🔴 Failed to lint workspaces', err);
        process.exit(1);
    });
