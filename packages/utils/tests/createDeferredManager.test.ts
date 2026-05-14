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

    it('generateId — uses provided function instead of counter', async () => {
        const ids = ['uuid-a', 'uuid-b', 'uuid-c'];
        let callCount = 0;
        const generateId = () => ids[callCount++];

        const manager = createDeferredManager({ generateId });

        const first = manager.create();
        const second = manager.create();

        expect(first.promiseId).toBe('uuid-a');
        expect(second.promiseId).toBe('uuid-b');

        setTimeout(() => manager.resolve('uuid-a', 'resolved-a'), 100);
        jest.advanceTimersByTime(100);

        await expect(first.promise).resolves.toBe('resolved-a');
        expect(manager.length()).toBe(1);

        manager.resolve('uuid-b', 'resolved-b');
        await expect(second.promise).resolves.toBe('resolved-b');
        expect(manager.length()).toBe(0);
    });

    it('generateId — onTimeout receives string id', () => {
        const onTimeout = jest.fn();
        let seq = 0;
        const manager = createDeferredManager({
            timeout: 200,
            onTimeout,
            generateId: () => `id-${++seq}`,
        });

        const first = manager.create();
        const second = manager.create(100);

        jest.advanceTimersByTime(150);

        expect(onTimeout).toHaveBeenCalledTimes(1);
        expect(onTimeout).toHaveBeenCalledWith('id-2');
        expect(typeof second.promiseId).toBe('string');
        expect(typeof first.promiseId).toBe('string');
    });

    it('generateId — works with crypto.randomUUID', async () => {
        const manager = createDeferredManager({ generateId: () => crypto.randomUUID() });

        const first = manager.create();
        const second = manager.create();

        expect(first.promiseId).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
        );
        expect(first.promiseId).not.toBe(second.promiseId);

        manager.resolve(first.promiseId, 'ok');
        manager.resolve(second.promiseId, 'ok2');

        await expect(first.promise).resolves.toBe('ok');
        await expect(second.promise).resolves.toBe('ok2');
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

    it('concurrency', async () => {
        const manager = createDeferredManager<void>();

        const first = manager.create();
        const secondPromise = manager.createConcurrent(2);
        const thirdPromise = manager.createConcurrent(2);

        let secondSettled = false;
        secondPromise.then(() => {
            secondSettled = true;
        });

        let thirdSettled = false;
        thirdPromise.then(() => {
            thirdSettled = true;
        });

        await Promise.resolve();

        expect(manager.length()).toBe(2);
        expect(secondSettled).toBe(true);
        expect(thirdSettled).toBe(false);

        manager.resolve(first.promiseId);

        await first.promise;

        await Promise.resolve();

        expect(manager.length()).toBe(2);
        expect(secondSettled).toBe(true);
        expect(thirdSettled).toBe(true);

        const fourth = manager.create();

        expect(manager.length()).toBe(3);

        const second = await secondPromise;
        const third = await thirdPromise;

        manager.resolve(second.promiseId);
        manager.resolve(third.promiseId);
        manager.resolve(fourth.promiseId);

        expect(manager.length()).toBe(0);
    });
});
