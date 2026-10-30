import { SILENT_QUERY_META, createQueryClient, injectQueryClient } from './createQueryClient';

describe('createQueryClient', () => {
    it.each([true, false])('refetches on focus, mount and reconnect: %s', shouldRefetchOnEvents => {
        const { queries } = createQueryClient({ shouldRefetchOnEvents }).getDefaultOptions();

        expect(queries).toMatchObject({
            refetchOnWindowFocus: shouldRefetchOnEvents,
            refetchOnMount: shouldRefetchOnEvents,
            refetchOnReconnect: shouldRefetchOnEvents,
        });
    });

    it('logs a failed query unless the query is silent', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        const queryClient = createQueryClient({ shouldRefetchOnEvents: false });
        const queryFn = () => Promise.reject(new Error('offline'));

        await expect(queryClient.fetchQuery({ queryKey: ['loud'], queryFn })).rejects.toThrow(
            'offline',
        );
        expect(console.error).toHaveBeenCalledTimes(1);

        await expect(
            queryClient.fetchQuery({ queryKey: ['quiet'], queryFn, meta: SILENT_QUERY_META }),
        ).rejects.toThrow('offline');
        expect(console.error).toHaveBeenCalledTimes(1);

        jest.restoreAllMocks();
    });

    it('creates an independent client per call', () => {
        const first = createQueryClient({ shouldRefetchOnEvents: false });
        const second = createQueryClient({ shouldRefetchOnEvents: false });

        first.setQueryData(['probe'], 1);

        expect(second.getQueryData(['probe'])).toBeUndefined();
    });
});

describe('injectQueryClient', () => {
    it('selects the query client from the services', () => {
        const queryClient = createQueryClient({ shouldRefetchOnEvents: false });

        expect(injectQueryClient({ queryClient })).toEqual({ queryClient });
    });
});
