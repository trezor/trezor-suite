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
});
