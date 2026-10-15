import { createSerialQueue } from './createSerialQueue';

const flushPendingPromises = () => new Promise(resolve => setImmediate(resolve));

const createDeferred = () => {
    let resolve = () => {};
    const promise = new Promise<void>(innerResolve => {
        resolve = innerResolve;
    });

    return { promise, resolve };
};

describe(createSerialQueue.name, () => {
    it('starts a task only once the one queued before it has settled', async () => {
        const runSerially = createSerialQueue();
        const first = createDeferred();
        const secondTask = jest.fn(() => Promise.resolve());

        const firstRun = runSerially(() => first.promise);
        const secondRun = runSerially(secondTask);
        await flushPendingPromises();

        expect(secondTask).not.toHaveBeenCalled();

        first.resolve();
        await Promise.all([firstRun, secondRun]);

        expect(secondTask).toHaveBeenCalledTimes(1);
    });

    it('runs the tasks in the order they were queued, however long each takes', async () => {
        const runSerially = createSerialQueue();
        const finished: string[] = [];

        const slow = runSerially(async () => {
            await flushPendingPromises();
            finished.push('slow');
        });
        const fast = runSerially(() => {
            finished.push('fast');

            return Promise.resolve();
        });
        await Promise.all([slow, fast]);

        expect(finished).toEqual(['slow', 'fast']);
    });

    it('resolves with what the task resolves with', async () => {
        const runSerially = createSerialQueue();

        await expect(runSerially(() => Promise.resolve('done'))).resolves.toBe('done');
    });

    it('rejects with what the task rejects with and still runs the task queued after it', async () => {
        const runSerially = createSerialQueue();

        const failing = runSerially(() => Promise.reject(new Error('failed')));
        const following = runSerially(() => Promise.resolve('ran'));

        await expect(failing).rejects.toThrow('failed');
        await expect(following).resolves.toBe('ran');
    });
});
