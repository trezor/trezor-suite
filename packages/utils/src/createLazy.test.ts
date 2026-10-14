import { createLazy } from './createLazy';

const returnDelayed =
    (ms: number) =>
    <T>(value: T) =>
        new Promise(resolve => setTimeout(() => resolve(value), ms));

describe('createLazy', () => {
    jest.useFakeTimers();

    it('basic', async () => {
        const initFn = jest.fn(returnDelayed(500));
        const lazy = createLazy(initFn);

        lazy.getOrInit('taxation');
        lazy.getOrInit('is');
        const initPromise = lazy.getOrInit('theft');

        expect(lazy.get()).toEqual(undefined);
        expect(lazy.getPending()).not.toEqual(undefined);

        jest.advanceTimersToNextTimerAsync();
        const res = await initPromise;

        expect(res).toEqual('taxation');
        expect(lazy.get()).toEqual('taxation');
        expect(lazy.getPending()).toEqual(undefined);
        expect(initFn).toHaveBeenCalledTimes(1);
    });

    it('dispose', async () => {
        const initFn = jest.fn(returnDelayed(500));
        const disposeFn = jest.fn();
        const lazy = createLazy(initFn, disposeFn);

        jest.advanceTimersToNextTimerAsync();
        await lazy.getOrInit([42]);

        expect(lazy.get()).toEqual([42]);

        lazy.dispose();

        expect(lazy.get()).toEqual(undefined);
        expect(disposeFn).toHaveBeenCalledWith([42]);
    });

    it('dispose during init', async () => {
        const initFn = jest.fn(returnDelayed(500));
        const lazy = createLazy(initFn);

        const initPromise = lazy.getOrInit(true);

        expect(lazy.getPending()).not.toEqual(undefined);

        jest.advanceTimersByTime(200);

        expect(lazy.getPending()).not.toEqual(undefined);

        lazy.dispose();

        expect(lazy.getPending()).toEqual(undefined);

        jest.advanceTimersByTime(400);

        expect(lazy.getPending()).toEqual(undefined);
        expect(lazy.get()).toEqual(undefined);
        await expect(initPromise).rejects.toThrow('Disposed during initialization');
    });

    it('disposes a stale value without affecting a newer initialization', async () => {
        const initFn = jest.fn((value: string) =>
            returnDelayed(value === 'first' ? 500 : 1000)(value),
        );
        const disposeFn = jest.fn();
        const lazy = createLazy(initFn, disposeFn);

        const firstPromise = lazy.getOrInit('first');
        firstPromise.catch(() => {});
        lazy.dispose();
        const secondPromise = lazy.getOrInit('second');

        expect(disposeFn).not.toHaveBeenCalled();

        await jest.advanceTimersByTimeAsync(500);

        expect(disposeFn).toHaveBeenCalledWith('first');
        expect(lazy.getPending()).toBe(secondPromise);

        await jest.advanceTimersByTimeAsync(500);

        await expect(secondPromise).resolves.toBe('second');
        expect(lazy.get()).toBe('second');
    });

    describe('dispose() return value', () => {
        const trackSettled = (promise: Promise<void>) => {
            const state = { settled: false };
            promise.then(() => {
                state.settled = true;
            });

            return state;
        };

        it('resolves immediately when there is nothing to dispose', async () => {
            const lazy = createLazy(jest.fn(returnDelayed(500)));

            await expect(lazy.dispose()).resolves.toBeUndefined();
        });

        it('resolves immediately when a ready value is disposed', async () => {
            const disposeFn = jest.fn();
            const lazy = createLazy(jest.fn(returnDelayed(500)), disposeFn);

            const initPromise = lazy.getOrInit('value');
            await jest.advanceTimersByTimeAsync(500);
            await initPromise;

            await expect(lazy.dispose()).resolves.toBeUndefined();
            expect(disposeFn).toHaveBeenCalledWith('value');
        });

        it('resolves only after the in-flight init settled and its stale value was disposed', async () => {
            const disposeFn = jest.fn();
            const lazy = createLazy(jest.fn(returnDelayed(500)), disposeFn);

            lazy.getOrInit('value').catch(() => {});
            const state = trackSettled(lazy.dispose());

            await jest.advanceTimersByTimeAsync(499);

            expect(state.settled).toBe(false);
            expect(disposeFn).not.toHaveBeenCalled();

            await jest.advanceTimersByTimeAsync(1);

            expect(state.settled).toBe(true);
            expect(disposeFn).toHaveBeenCalledWith('value');
        });

        it('resolves without throwing when the in-flight init fails', async () => {
            const disposeFn = jest.fn();
            const initFn = jest.fn(
                () =>
                    new Promise<string>((_, reject) => {
                        setTimeout(() => reject(new Error('init failed')), 500);
                    }),
            );
            const lazy = createLazy(initFn, disposeFn);

            lazy.getOrInit().catch(() => {});
            const state = trackSettled(lazy.dispose());

            await jest.advanceTimersByTimeAsync(499);
            expect(state.settled).toBe(false);

            await jest.advanceTimersByTimeAsync(1);

            expect(state.settled).toBe(true);
            expect(disposeFn).not.toHaveBeenCalled();
        });
    });
});
