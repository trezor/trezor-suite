import { createTryLock } from '../src/tryLock';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe(createTryLock.name, () => {
    it('skips the task if already locked', async () => {
        const tryLock = createTryLock();

        let a = 0;

        const task = async (ms: number) => {
            a += 1;
            await wait(ms);
        };

        await Promise.all([
            tryLock(() => task(10)),
            tryLock(() => task(3)),
            tryLock(() => task(5)),
        ]);

        expect(a).toBe(1);
    });

    it('running tasks in sequence runs them all', async () => {
        const tryLock = createTryLock();

        let a = 0;

        const task = async (ms: number) => {
            a += 1;
            await wait(ms);
        };

        await tryLock(() => task(10));
        await tryLock(() => task(3));
        await tryLock(() => task(5));

        expect(a).toBe(3);
    });
});
