import { createKeyedThrottle } from '../src/createKeyedThrottle';

describe('createKeyedThrottle', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('canRun is true for an id that never ran (getLastRun returns undefined)', () => {
        const throttle = createKeyedThrottle(1000, () => undefined);
        expect(throttle.canRun('a')).toBe(true);
    });

    it('canRun is false until the interval elapses since the last run', () => {
        const lastRun: Record<string, number> = {};
        const throttle = createKeyedThrottle(1000, id => lastRun[id]);

        lastRun.a = Date.now();

        expect(throttle.canRun('a')).toBe(false);
        jest.advanceTimersByTime(999);
        expect(throttle.canRun('a')).toBe(false);
        jest.advanceTimersByTime(1); // exactly at the boundary
        expect(throttle.canRun('a')).toBe(true);
    });

    it('reads each id independently from getLastRun', () => {
        const lastRun: Record<string, number> = { a: Date.now() };
        const throttle = createKeyedThrottle(1000, id => lastRun[id]);

        expect(throttle.canRun('a')).toBe(false);
        expect(throttle.canRun('b')).toBe(true);
    });

    it('reflects live changes from getLastRun', () => {
        const lastRun: Record<string, number> = {};
        const throttle = createKeyedThrottle(1000, id => lastRun[id]);

        expect(throttle.canRun('a')).toBe(true);
        lastRun.a = Date.now(); // e.g. the store recorded a refresh
        expect(throttle.canRun('a')).toBe(false);
    });
});
