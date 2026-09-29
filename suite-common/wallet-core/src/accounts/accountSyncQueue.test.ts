import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { type Deferred, createDeferred } from '@trezor/utils';

import { createAccountSyncQueue } from './accountSyncQueue';

const flush = () =>
    new Promise(resolve => {
        setTimeout(resolve, 0);
    });

const createSync = () => {
    const runs: Deferred<void>[] = [];
    const sync = jest.fn(() => {
        const run = createDeferred<void>();
        runs.push(run);

        return run.promise;
    });

    const getRun = (index: number) => {
        const run = runs[index];
        if (!run) throw new Error(`sync run ${index} was never started`);

        return run;
    };

    return {
        sync,
        runCount: () => sync.mock.calls.length,
        finishRun: async (index: number) => {
            getRun(index).resolve();
            await flush();
        },
        failRun: async (index: number) => {
            getRun(index).reject(new Error('sync failed'));
            await flush();
        },
    };
};

const accountKey = mockAccountKey({ descriptor: 'first' });
const otherAccountKey = mockAccountKey({ descriptor: 'second' });

describe(createAccountSyncQueue.name, () => {
    it('starts a sync right away when the account has none in flight', () => {
        const queueAccountSync = createAccountSyncQueue();
        const { sync, runCount } = createSync();

        queueAccountSync(accountKey, sync);

        expect(runCount()).toBe(1);
    });

    it('coalesces requests arriving during a sync into a single trailing run', async () => {
        const queueAccountSync = createAccountSyncQueue();
        const { sync, runCount, finishRun } = createSync();

        queueAccountSync(accountKey, sync);
        await flush();

        queueAccountSync(accountKey, sync);
        queueAccountSync(accountKey, sync);
        queueAccountSync(accountKey, sync);
        await flush();

        expect(runCount()).toBe(1);

        await finishRun(0);

        expect(runCount()).toBe(2);
    });

    it('stops once a sync finishes with nothing queued behind it', async () => {
        const queueAccountSync = createAccountSyncQueue();
        const { sync, runCount, finishRun } = createSync();

        queueAccountSync(accountKey, sync);
        await flush();
        queueAccountSync(accountKey, sync);

        await finishRun(0);
        expect(runCount()).toBe(2);

        await finishRun(1);
        expect(runCount()).toBe(2);
    });

    it('keeps picking up requests that arrive while the trailing sync runs', async () => {
        const queueAccountSync = createAccountSyncQueue();
        const { sync, runCount, finishRun } = createSync();

        queueAccountSync(accountKey, sync);
        await flush();
        queueAccountSync(accountKey, sync);
        await finishRun(0);

        expect(runCount()).toBe(2);

        queueAccountSync(accountKey, sync);
        await finishRun(1);

        expect(runCount()).toBe(3);
    });

    it('resolves a coalesced request only once the trailing sync has finished', async () => {
        const queueAccountSync = createAccountSyncQueue();
        const { sync, finishRun } = createSync();

        queueAccountSync(accountKey, sync);
        await flush();

        const coalesced = jest.fn();
        queueAccountSync(accountKey, sync).then(coalesced);

        await finishRun(0);
        expect(coalesced).not.toHaveBeenCalled();

        await finishRun(1);
        expect(coalesced).toHaveBeenCalled();
    });

    it('runs the trailing sync even when the one before it failed', async () => {
        const queueAccountSync = createAccountSyncQueue();
        const { sync, runCount, failRun } = createSync();

        queueAccountSync(accountKey, sync).catch(() => {});
        await flush();
        queueAccountSync(accountKey, sync).catch(() => {});

        await failRun(0);

        expect(runCount()).toBe(2);
    });

    it('accepts a new sync for an account whose previous one failed', async () => {
        const queueAccountSync = createAccountSyncQueue();
        const { sync, runCount, failRun } = createSync();

        queueAccountSync(accountKey, sync).catch(() => {});
        await flush();
        await failRun(0);

        queueAccountSync(accountKey, sync);
        await flush();

        expect(runCount()).toBe(2);
    });

    it('does not make accounts wait for each other', async () => {
        const queueAccountSync = createAccountSyncQueue();
        const { sync, runCount } = createSync();

        queueAccountSync(accountKey, sync);
        queueAccountSync(otherAccountKey, sync);
        await flush();

        expect(runCount()).toBe(2);
    });
});
