import { createKeyedThrottle } from '../src/createKeyedThrottle';

describe('createKeyedThrottle', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('canRun', () => {
        it('is true for an id that never ran', () => {
            const throttle = createKeyedThrottle(1000);
            expect(throttle.canRun('a')).toBe(true);
        });

        it('is false right after markRun and until the interval elapses', () => {
            const throttle = createKeyedThrottle(1000);
            throttle.markRun('a');

            expect(throttle.canRun('a')).toBe(false);
            jest.advanceTimersByTime(999);
            expect(throttle.canRun('a')).toBe(false);
            jest.advanceTimersByTime(1); // exactly at the boundary
            expect(throttle.canRun('a')).toBe(true);
        });

        it('tracks ids independently', () => {
            const throttle = createKeyedThrottle(1000);
            throttle.markRun('a');

            expect(throttle.canRun('a')).toBe(false);
            expect(throttle.canRun('b')).toBe(true);
        });

        it('re-marking extends the window', () => {
            const throttle = createKeyedThrottle(1000);
            throttle.markRun('a');
            jest.advanceTimersByTime(800);
            throttle.markRun('a');
            jest.advanceTimersByTime(800); // 1600 since first mark, 800 since second

            expect(throttle.canRun('a')).toBe(false);
        });
    });

    describe('reset / resetAll', () => {
        it('reset makes only that id runnable again', () => {
            const throttle = createKeyedThrottle(1000);
            throttle.markRun('a');
            throttle.markRun('b');

            throttle.reset('a');

            expect(throttle.canRun('a')).toBe(true);
            expect(throttle.canRun('b')).toBe(false);
        });

        it('reset on an unknown id is a no-op', () => {
            const throttle = createKeyedThrottle(1000);
            expect(() => throttle.reset('nope')).not.toThrow();
            expect(throttle.canRun('nope')).toBe(true);
        });

        it('resetAll makes every id runnable again', () => {
            const throttle = createKeyedThrottle(1000);
            throttle.markRun('a');
            throttle.markRun('b');

            throttle.resetAll();

            expect(throttle.canRun('a')).toBe(true);
            expect(throttle.canRun('b')).toBe(true);
        });
    });
});
