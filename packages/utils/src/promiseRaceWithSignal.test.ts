import { createDeferred } from './createDeferred';
import { promiseRaceWithSignal } from './promiseRaceWithSignal';

describe('promiseRaceWithSignal', () => {
    it('returns the same promise when there is no signal', () => {
        const promise = Promise.resolve('foo');

        expect(promiseRaceWithSignal(promise)).toBe(promise);
    });

    it('resolves with the value of the promise', async () => {
        const controller = new AbortController();

        await expect(
            promiseRaceWithSignal(Promise.resolve('foo'), controller.signal),
        ).resolves.toBe('foo');
    });

    it('rejects with the error of the promise', async () => {
        const controller = new AbortController();

        await expect(
            promiseRaceWithSignal(Promise.reject(new Error('foo')), controller.signal),
        ).rejects.toThrow('foo');
    });

    it('rejects with the reason of the signal when aborted while pending', async () => {
        const controller = new AbortController();
        const { promise } = createDeferred();

        const raced = promiseRaceWithSignal(promise, controller.signal);
        controller.abort(new Error('stop'));

        await expect(raced).rejects.toThrow('stop');
    });

    it('rejects with the default reason of the signal when aborted without one', async () => {
        const controller = new AbortController();
        const { promise } = createDeferred();

        const raced = promiseRaceWithSignal(promise, controller.signal);
        controller.abort();

        await expect(raced).rejects.toBe(controller.signal.reason);
    });

    it('rejects when the signal is already aborted', async () => {
        const { promise } = createDeferred();

        await expect(
            promiseRaceWithSignal(promise, AbortSignal.abort(new Error('stop'))),
        ).rejects.toThrow('stop');
    });

    it('does not affect the settled result when aborted afterwards', async () => {
        const controller = new AbortController();
        const dfd = createDeferred<string>();

        const raced = promiseRaceWithSignal(dfd.promise, controller.signal);
        dfd.resolve('foo');
        await expect(raced).resolves.toBe('foo');

        controller.abort(new Error('stop'));

        await expect(raced).resolves.toBe('foo');
    });

    it('does not cancel the promise itself', async () => {
        const controller = new AbortController();
        const dfd = createDeferred<string>();

        const raced = promiseRaceWithSignal(dfd.promise, controller.signal);
        controller.abort(new Error('stop'));
        await expect(raced).rejects.toThrow('stop');

        dfd.resolve('foo');

        await expect(dfd.promise).resolves.toBe('foo');
    });

    it('removes its abort listener once the promise settles', async () => {
        const controller = new AbortController();
        const addSpy = jest.spyOn(controller.signal, 'addEventListener');
        const removeSpy = jest.spyOn(controller.signal, 'removeEventListener');

        await promiseRaceWithSignal(Promise.resolve('foo'), controller.signal);
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(removeSpy).toHaveBeenCalledTimes(1);
        expect(removeSpy).toHaveBeenCalledWith('abort', addSpy.mock.calls[0]?.[1]);
    });
});
