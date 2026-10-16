import { createDeferred } from '@trezor/utils';

import { createConcurrencyLimiter } from './fiatRatesConcurrencyLimiter';

describe(createConcurrencyLimiter.name, () => {
    it('runs at most the given number of tasks at once, in the order they were added', async () => {
        const limit = createConcurrencyLimiter(2);
        const deferreds = [
            createDeferred<number>(),
            createDeferred<number>(),
            createDeferred<number>(),
        ];
        const started: number[] = [];

        const results = deferreds.map((deferred, index) =>
            limit(() => {
                started.push(index);

                return deferred.promise;
            }),
        );

        expect(started).toEqual([0, 1]);

        deferreds[1]?.resolve(1);
        await results[1];

        expect(started).toEqual([0, 1, 2]);

        deferreds[0]?.resolve(0);
        deferreds[2]?.resolve(2);

        await expect(Promise.all(results)).resolves.toEqual([0, 1, 2]);
    });

    it('starts the next task when a running task rejects', async () => {
        const limit = createConcurrencyLimiter(1);
        const failingTask = limit(() => Promise.reject(new Error('failed')));
        const nextTask = limit(() => Promise.resolve('next'));

        await expect(failingTask).rejects.toThrow('failed');
        await expect(nextTask).resolves.toBe('next');
    });
});
