import { createQueryClient, injectQueryClient } from './createQueryClient';

describe('createQueryClient', () => {
    it.each([true, false])('refetches on focus, mount and reconnect: %s', shouldRefetchOnEvents => {
        const { queries } = createQueryClient({ shouldRefetchOnEvents }).getDefaultOptions();

        expect(queries).toMatchObject({
            refetchOnWindowFocus: shouldRefetchOnEvents,
            refetchOnMount: shouldRefetchOnEvents,
            refetchOnReconnect: shouldRefetchOnEvents,
        });
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
