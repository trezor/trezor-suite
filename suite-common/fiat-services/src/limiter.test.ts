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
});
