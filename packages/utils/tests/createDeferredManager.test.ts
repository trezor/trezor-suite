import { createDeferredManager } from '../src/createDeferredManager';

describe('createDeferredManager', () => {
    jest.useFakeTimers();

    it('basic', async () => {
        const manager = createDeferredManager();

        const first = manager.create();
        const second = manager.create();

        setTimeout(() => manager.resolve(first.promiseId, 'foo'), 200);
        setTimeout(() => manager.reject(second.promiseId, new Error('bar')), 100);

        expect(manager.length()).toBe(2);

        jest.advanceTimersByTime(100);

        await expect(second.promise).rejects.toThrow('bar');
        expect(manager.length()).toBe(1);

        jest.advanceTimersByTime(100);

        await expect(first.promise).resolves.toBe('foo');
        expect(manager.length()).toBe(0);
    });

    it('timeout', () => {
        const onTimeout = jest.fn();
        const manager = createDeferredManager({ timeout: 200, onTimeout });

        const first = manager.create();
        const second = manager.create(300);
        const third = manager.create(100);

        jest.advanceTimersByTime(150);

        expect(onTimeout).toHaveBeenCalledTimes(1);

        jest.advanceTimersByTime(100);

        expect(onTimeout).toHaveBeenCalledTimes(2);

        jest.advanceTimersByTime(150);

        expect(manager.length()).toBe(3);
        expect(onTimeout).toHaveBeenCalledTimes(3);
        expect(onTimeout).toHaveBeenNthCalledWith(1, third.promiseId);
        expect(onTimeout).toHaveBeenNthCalledWith(2, first.promiseId);
        expect(onTimeout).toHaveBeenNthCalledWith(3, second.promiseId);
    });

    it('reject all but first', async () => {
        const onTimeout = jest.fn();
        const manager = createDeferredManager({
            timeout: 200,
            onTimeout: id => {
                onTimeout(id);
                manager.resolve(id, 'foo');
                manager.rejectAll(new Error('err'));
            },
        });

        const first = manager.create();
        const second = manager.create(300);
        const third = manager.create(100);

        expect(manager.length()).toBe(3);

        jest.advanceTimersByTime(300);

        expect(manager.length()).toBe(0);

        await Promise.all([
            expect(first.promise).rejects.toThrow('err'),
            expect(second.promise).rejects.toThrow('err'),
            expect(third.promise).resolves.toBe('foo'),
        ]);

        expect(onTimeout).toHaveBeenCalledTimes(1);
        expect(onTimeout).toHaveBeenCalledWith(third.promiseId);
    });
});
