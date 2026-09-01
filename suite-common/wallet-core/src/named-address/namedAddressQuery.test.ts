import type { NetworkModuleRepository, NetworkSymbol } from '@suite-common/networks';
import { QueryClient } from '@suite-common/react-query';

import { getResolveNamedAddressQueryOptions } from './namedAddressQuery';
import type { SymbolNamedAddressResolver } from './namedAddressResolver';

const mockResolveNamedAddress = jest.fn();
const mockReverseResolveAddress = jest.fn();

// A stand-in for whichever network module owns names: the query layer must not know how any
// of these questions are answered, only which of them decides the mode.
const namedAddressResolver: SymbolNamedAddressResolver = {
    supportsNamedAddress: symbol => symbol === 'eth' || symbol === 'tsep',
    isNameLike: value => value.trim().includes('.'),
    isAddressLike: value => /^0x[a-fA-F0-9]{40}$/.test(value.trim()),
    resolveNamedAddress: (...args) => mockResolveNamedAddress(...args),
    reverseResolveAddress: (...args) => mockReverseResolveAddress(...args),
    resolveNamedProfile: jest.fn(),
};

const networkModuleRepository = {
    get: () => ({ namedAddressResolver }),
} as unknown as NetworkModuleRepository;

const queryOptions = (value: string, symbol: NetworkSymbol | null, identity?: string) =>
    getResolveNamedAddressQueryOptions({ networkModuleRepository, value, symbol, identity });

const RESOLVED_HEX = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

describe('getResolveNamedAddressQueryOptions', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        mockResolveNamedAddress.mockReset();
        mockReverseResolveAddress.mockReset();
        queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    });

    // Each cached query holds a garbage-collection timer for its whole `gcTime`, which would
    // otherwise keep the test runner alive long after the assertions finish.
    afterEach(() => {
        queryClient.clear();
    });

    describe('query key', () => {
        it('keys a padded value the same as its trimmed form', () => {
            expect(queryOptions('  vitalik.eth  ', 'eth').queryKey).toEqual(
                queryOptions('vitalik.eth', 'eth').queryKey,
            );
        });

        it('keys each network separately', () => {
            expect(queryOptions('vitalik.eth', 'eth').queryKey).not.toEqual(
                queryOptions('vitalik.eth', 'tsep').queryKey,
            );
        });

        it('keys each value separately', () => {
            expect(queryOptions('vitalik.eth', 'eth').queryKey).not.toEqual(
                queryOptions('nick.eth', 'eth').queryKey,
            );
        });

        // The answer is public and identical whoever asks, so accounts share one entry instead
        // of each paying for the same lookup.
        it('keys the same value alike across backend identities', () => {
            expect(queryOptions('vitalik.eth', 'eth', 'deviceA').queryKey).toEqual(
                queryOptions('vitalik.eth', 'eth', 'deviceB').queryKey,
            );
        });

        it('keys a missing symbol without colliding with a real one', () => {
            expect(queryOptions('vitalik.eth', null).queryKey).not.toEqual(
                queryOptions('vitalik.eth', 'eth').queryKey,
            );
        });
    });

    describe('caching', () => {
        it('resolves the same name once across repeated fetches', async () => {
            mockResolveNamedAddress.mockResolvedValue(RESOLVED_HEX);

            const options = queryOptions('vitalik.eth', 'eth');
            await queryClient.ensureQueryData(options);
            await queryClient.ensureQueryData(options);

            expect(mockResolveNamedAddress).toHaveBeenCalledTimes(1);
        });

        // The form validator passes the raw input while the hook passes the trimmed one; both
        // must land on the same entry or a padded paste costs two round trips.
        it('shares one cache entry between a padded and a trimmed value', async () => {
            mockResolveNamedAddress.mockResolvedValue(RESOLVED_HEX);

            await queryClient.ensureQueryData(queryOptions('  vitalik.eth  ', 'eth'));
            const cached = await queryClient.ensureQueryData(queryOptions('vitalik.eth', 'eth'));

            expect(cached).toBe(RESOLVED_HEX);
            expect(mockResolveNamedAddress).toHaveBeenCalledTimes(1);
        });

        it('trims the value before handing it to the resolver', async () => {
            mockResolveNamedAddress.mockResolvedValue(RESOLVED_HEX);

            await queryClient.ensureQueryData(queryOptions('  vitalik.eth  ', 'eth'));

            expect(mockResolveNamedAddress).toHaveBeenCalledWith('vitalik.eth', 'eth', {
                identity: undefined,
            });
        });

        it('refetches once the entry is invalidated', async () => {
            mockResolveNamedAddress.mockResolvedValue(RESOLVED_HEX);

            const options = queryOptions('vitalik.eth', 'eth');
            await queryClient.ensureQueryData(options);
            queryClient.removeQueries({ queryKey: options.queryKey });
            await queryClient.ensureQueryData(options);

            expect(mockResolveNamedAddress).toHaveBeenCalledTimes(2);
        });

        it('does not resolve a different name from the cached one', async () => {
            mockResolveNamedAddress.mockResolvedValue(RESOLVED_HEX);

            await queryClient.ensureQueryData(queryOptions('vitalik.eth', 'eth'));
            await queryClient.ensureQueryData(queryOptions('nick.eth', 'eth'));

            expect(mockResolveNamedAddress).toHaveBeenCalledTimes(2);
        });
    });

    describe('mode dispatch', () => {
        it('forward-resolves a name', async () => {
            mockResolveNamedAddress.mockResolvedValue(RESOLVED_HEX);

            await queryClient.ensureQueryData(queryOptions('vitalik.eth', 'eth'));

            expect(mockResolveNamedAddress).toHaveBeenCalledTimes(1);
            expect(mockReverseResolveAddress).not.toHaveBeenCalled();
        });

        it('reverse-resolves a hex address', async () => {
            mockReverseResolveAddress.mockResolvedValue('vitalik.eth');

            await queryClient.ensureQueryData(queryOptions(RESOLVED_HEX, 'eth'));

            expect(mockReverseResolveAddress).toHaveBeenCalledWith(RESOLVED_HEX, 'eth', {
                identity: undefined,
            });
            expect(mockResolveNamedAddress).not.toHaveBeenCalled();
        });

        it('hands the backend identity to both modes', async () => {
            mockResolveNamedAddress.mockResolvedValue(RESOLVED_HEX);
            mockReverseResolveAddress.mockResolvedValue('vitalik.eth');

            await queryClient.ensureQueryData(queryOptions('vitalik.eth', 'eth', 'deviceState'));
            await queryClient.ensureQueryData(queryOptions(RESOLVED_HEX, 'eth', 'deviceState'));

            const options = { identity: 'deviceState' };
            expect(mockResolveNamedAddress).toHaveBeenCalledWith('vitalik.eth', 'eth', options);
            expect(mockReverseResolveAddress).toHaveBeenCalledWith(RESOLVED_HEX, 'eth', options);
        });

        it('rejects rather than resolving an unsupported symbol', async () => {
            await expect(
                queryClient.ensureQueryData(queryOptions('vitalik.eth', 'btc')),
            ).rejects.toThrow('Unsupported resolve mode: idle');
            expect(mockResolveNamedAddress).not.toHaveBeenCalled();
        });
    });
});
