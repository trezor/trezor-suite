import { createLazy } from '../src/createLazy';

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

    it('dispose during init', () => {
        const initFn = jest.fn(returnDelayed(500));
        const lazy = createLazy(initFn);

        const initPromise = lazy.getOrInit(true);

        expect(lazy.getPending()).not.toEqual(undefined);

        jest.advanceTimersByTime(200);

        expect(lazy.getPending()).not.toEqual(undefined);

        lazy.dispose();

        expect(lazy.getPending()).toEqual(undefined);

        jest.advanceTimersByTime(400);

        expect(initPromise).rejects.toThrow('Disposed during initialization');
        expect(lazy.getPending()).toEqual(undefined);
        expect(lazy.get()).toEqual(undefined);
    });
});
