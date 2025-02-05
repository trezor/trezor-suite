import { resolveAfter } from '../src/resolveAfter';

describe('resolveAfter', () => {
    jest.useFakeTimers();

    it('resolves after specified time', async () => {
        const promise = resolveAfter(200, undefined, 'foo');

        jest.advanceTimersByTime(200);

        await expect(promise).resolves.toBe('foo');
    });

    it('rejects if the promise is rejected', async () => {
        const abort = new AbortController();
        const promise = resolveAfter(200, abort.signal);

        // Reject the promise after 100ms
        setTimeout(() => abort.abort(new Error('bar')), 100);

        jest.advanceTimersByTime(100);

        await expect(promise).rejects.toThrow('bar');
    });
});
