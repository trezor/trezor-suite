import { resolveAfter } from '../src/resolveAfter';

describe('resolveAfter', () => {
    jest.useFakeTimers();

    it('resolves after specified time', async () => {
        const { promise } = resolveAfter(200, 'foo');

        jest.advanceTimersByTime(200);

        await expect(promise).resolves.toBe('foo');
    });

    it('rejects if the promise is rejected', async () => {
        const { promise, reject } = resolveAfter(200);

        // Reject the promise after 100ms
        setTimeout(() => reject(new Error('bar')), 100);

        jest.advanceTimersByTime(100);

        await expect(promise).rejects.toThrow('bar');
    });
});
