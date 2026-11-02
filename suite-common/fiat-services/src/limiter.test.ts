import { RateLimiter } from './limiter';

describe('RateLimiter', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('delay is honoured', async () => {
        const delay = 42;
        const limiter = new RateLimiter(delay, 1_000);
        const task = () => Promise.resolve(Date.now());

        const results = Promise.all([
            limiter.limit(task),
            limiter.limit(task),
            limiter.limit(task),
        ]);
        await jest.advanceTimersByTimeAsync(2 * delay);
        const timestamps = await results;

        expect(timestamps[1] - timestamps[0]).toBe(delay);
        expect(timestamps[2] - timestamps[1]).toBe(delay);
    });

    test('skips a request whose caller left while it waited, and the gap after it', async () => {
        const delay = 42;
        const limiter = new RateLimiter(delay, 1_000);
        const task = jest.fn(() => Promise.resolve(Date.now()));
        const controller = new AbortController();

        const first = limiter.limit(task);
        const abandoned = limiter.limit(task, controller.signal).catch(error => error);
        const last = limiter.limit(task);
        controller.abort();
        await jest.advanceTimersByTimeAsync(2 * delay);

        expect(await abandoned).toBe(controller.signal.reason);
        expect((await last) - (await first)).toBe(delay);
        expect(task).toHaveBeenCalledTimes(2);
    });

    test('lets priority requests ahead of the waiting ones, but not of the running one', async () => {
        const delay = 42;
        const limiter = new RateLimiter(delay, 1_000);
        const order: string[] = [];
        const task = (name: string) => () => {
            order.push(name);

            return Promise.resolve(Date.now());
        };

        const first = limiter.limit(task('first'));
        const second = limiter.limit(task('second'));
        const firstPriority = limiter.limit(task('first priority'), undefined, {
            priority: 'high',
        });
        const secondPriority = limiter.limit(task('second priority'), undefined, {
            priority: 'high',
        });
        await jest.advanceTimersByTimeAsync(3 * delay);

        expect(order).toEqual(['first', 'first priority', 'second priority', 'second']);
        expect((await firstPriority) - (await first)).toBe(delay);
        expect((await secondPriority) - (await firstPriority)).toBe(delay);
        expect((await second) - (await secondPriority)).toBe(delay);
    });
});
