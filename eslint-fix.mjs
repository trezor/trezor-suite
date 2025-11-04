// @ts-check
/* eslint-disable no-console */
import { execSync } from 'node:child_process';
import { cpus } from 'node:os';
import { Worker } from 'node:worker_threads';

function getWorkspaces() {
    const workspacesRaw = execSync('yarn workspaces list --json', { encoding: 'utf8' });
    const blacklistedWorkspaces = new Set(['scripts', '.']);

    return workspacesRaw
        .trim()
        .split('\n')
        .map(line => JSON.parse(line).location)
        .filter(location => !blacklistedWorkspaces.has(location));
}

const workspaces = getWorkspaces().slice(80);
const coreCount = cpus().length;
const batchSize = 1;

const activeTasks = new Map();

console.log(
    `Found ${workspaces.length} workspaces. Batch size: ${batchSize}. Using ${coreCount} cores.`,
);

let batchIndex = 0;
let batchCount = 0;

while (batchIndex < workspaces.length) {
    const batch = workspaces.slice(batchIndex, batchIndex + batchSize);

    if (batch.length === 0) {
        break;
    }

    console.log(
        `Applying ESLint fix for batch of workspaces: ${batchCount}/${Math.ceil(workspaces.length / batchSize)}. Active workers: ${activeTasks.size}`,
    );
    batchIndex += batchSize;
    batchCount++;

    const worker = new Worker(new URL('./eslint-fix-worker.mjs', import.meta.url));

    activeTasks.set(
        worker.threadId,
        new Promise((resolve, reject) => {
            worker.once('message', async message => {
                await worker.terminate();
                activeTasks.delete(worker.threadId);

                if (message.success) {
                    resolve(true);
                } else {
                    console.error('Worker error:', message.error);
                    // reject(message.error);
                    resolve(false);
                }
            });
        }),
    );

    worker.postMessage(batch);

    if (activeTasks.size >= coreCount) {
        // Waiting for some worker to finish before spawning a new one
        // Yes, I know that Promice.race would make sense however I have somewhere a bug and the `activeTasks.size` with Promise.race is not working as expected (i.e. it creates more workers than expected `coreCount`).
        await Promise.all(Array.from(activeTasks.values()));
        activeTasks.clear();
    } else {
        console.log(`Spawning new worker #${worker.threadId}. Active workers: ${activeTasks.size}`);
    }
}

await Promise.all(Array.from(activeTasks.values())).then(() => {
    console.log('All tasks finished');
    process.exit(0);
});
