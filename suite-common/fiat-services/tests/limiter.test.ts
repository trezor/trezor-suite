import { RateLimiter } from '../src/limiter';

describe('RateLimiter', () => {
    test('delay is honoured', async () => {
        const delay = 42;
        const limiter = new RateLimiter(delay, 1_000);
        const task = () => Promise.resolve(performance.now());

        const timestamps = await Promise.all([
            limiter.limit(task),
            limiter.limit(task),
            limiter.limit(task),
        ]);

        expect(timestamps[1] - timestamps[0]).toBeGreaterThanOrEqual(delay);
        expect(timestamps[2] - timestamps[1]).toBeGreaterThanOrEqual(delay);
    });
});
