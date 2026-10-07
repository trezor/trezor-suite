import { CONFIDENTIAL_QUERY_META, createQueryClient } from './createQueryClient';

const DESCRIPTOR = 'zpub-confidential';

describe('createQueryClient', () => {
    let errorSpy: jest.SpyInstance;
    let warnSpy: jest.SpyInstance;

    beforeEach(() => {
        errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('logs failed queries as errors', async () => {
        const queryClient = createQueryClient('web');
        const error = new Error('Proxy unavailable');

        await expect(
            queryClient.fetchQuery({ queryKey: ['public'], queryFn: () => Promise.reject(error) }),
        ).rejects.toBe(error);

        expect(errorSpy).toHaveBeenCalledWith(error);
    });

    it('logs only the error name of a failed confidential query', async () => {
        const queryClient = createQueryClient('web');

        await expect(
            queryClient.fetchQuery({
                queryKey: ['chain', 'btc', 'blockbook', 'account', DESCRIPTOR, 'balance'],
                queryFn: () => Promise.reject(new TypeError(`Bad descriptor ${DESCRIPTOR}`)),
                meta: CONFIDENTIAL_QUERY_META,
            }),
        ).rejects.toThrow();

        expect(errorSpy).not.toHaveBeenCalled();
        expect(warnSpy).toHaveBeenCalledWith('Confidential query failed: TypeError');
        expect(JSON.stringify(warnSpy.mock.calls)).not.toContain(DESCRIPTOR);
    });

    it('logs only the error name of a failed confidential mutation', async () => {
        const queryClient = createQueryClient('native');
        const mutation = queryClient.getMutationCache().build(queryClient, {
            mutationFn: () => Promise.reject(new Error(DESCRIPTOR)),
            meta: CONFIDENTIAL_QUERY_META,
        });

        await expect(mutation.execute(undefined)).rejects.toThrow();

        expect(errorSpy).not.toHaveBeenCalled();
        expect(JSON.stringify(warnSpy.mock.calls)).not.toContain(DESCRIPTOR);
    });

    it.each([
        { platform: 'web' as const, refetch: true },
        { platform: 'native' as const, refetch: false },
    ])('refetches on window events on $platform: $refetch', ({ platform, refetch }) => {
        const { queries } = createQueryClient(platform).getDefaultOptions();

        expect(queries).toMatchObject({
            refetchOnWindowFocus: refetch,
            refetchOnMount: refetch,
            refetchOnReconnect: refetch,
        });
    });
});
