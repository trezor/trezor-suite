import { QueryClient } from '@tanstack/react-query';

import { createDeferred } from '@trezor/utils';

import { createAbortableQuery } from './createAbortableQuery';

const createFetch = () => {
    const response = createDeferred<string>();
    const queryFn = jest.fn((_context: { signal: AbortSignal }) => response.promise);

    return { queryFn, response };
};

describe('createAbortableQuery', () => {
    it('shares one fetch among concurrent callers of a key', async () => {
        const abortableQuery = createAbortableQuery({ queryClient: new QueryClient() });
        const { queryFn, response } = createFetch();

        const results = Promise.all([
            abortableQuery({ queryKey: ['stats'], queryFn }),
            abortableQuery({ queryKey: ['stats'], queryFn }),
        ]);
        response.resolve('stats');

        await expect(results).resolves.toEqual(['stats', 'stats']);
        expect(queryFn).toHaveBeenCalledTimes(1);
    });

    it('applies the default options', async () => {
        const abortableQuery = createAbortableQuery({
            queryClient: new QueryClient(),
            defaultOptions: { staleTime: Infinity },
        });
        const { queryFn, response } = createFetch();
        response.resolve('stats');

        await abortableQuery({ queryKey: ['stats'], queryFn });
        await abortableQuery({ queryKey: ['stats'], queryFn });

        expect(queryFn).toHaveBeenCalledTimes(1);
    });

    it('lets the caller’s options override the default ones', async () => {
        const abortableQuery = createAbortableQuery({
            queryClient: new QueryClient(),
            defaultOptions: { staleTime: Infinity },
        });
        const { queryFn, response } = createFetch();
        response.resolve('stats');

        await abortableQuery({ queryKey: ['stats'], queryFn, staleTime: 0 });
        await abortableQuery({ queryKey: ['stats'], queryFn, staleTime: 0 });

        expect(queryFn).toHaveBeenCalledTimes(2);
    });

    it('stops only the aborted caller, leaving the shared fetch to the others', async () => {
        const abortableQuery = createAbortableQuery({ queryClient: new QueryClient() });
        const { queryFn, response } = createFetch();
        const abortController = new AbortController();

        const abortedResult = abortableQuery({
            queryKey: ['stats'],
            queryFn,
            signal: abortController.signal,
        });
        const result = abortableQuery({ queryKey: ['stats'], queryFn });
        abortController.abort(new Error('Left the page'));
        response.resolve('stats');

        await expect(abortedResult).rejects.toThrow('Left the page');
        await expect(result).resolves.toBe('stats');
        expect(queryFn.mock.calls[0]?.[0].signal.aborted).toBe(false);
    });
});
