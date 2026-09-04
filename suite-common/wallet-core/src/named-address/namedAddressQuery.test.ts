import type { GetNamedAddressSupport, SymbolNamedAddressResolver } from '@suite-common/networks';
import { mockGetNamedAddressSupport } from '@suite-common/networks/mocks';
import { QueryClient } from '@suite-common/react-query';
import { type NetworkSymbol, asNetworkSymbol } from '@trezor/network-module';

import { getResolveNamedAddressQueryOptions } from './namedAddressQuery';

const mockResolveNamedAddress = jest.fn();
const mockReverseResolveAddress = jest.fn();
const btcSymbol = asNetworkSymbol('btc');
const ethSymbol = asNetworkSymbol('eth');
const tsepSymbol = asNetworkSymbol('tsep');

// A stand-in for whichever network module owns names: the query layer must not know how any
// of these questions are answered, only which of them decides the mode.
const namedAddressResolver: SymbolNamedAddressResolver = {
    supportsNamedAddress: symbol => symbol === ethSymbol || symbol === tsepSymbol,
    isNameLike: value => value.trim().includes('.'),
    isAddressLike: value => /^0x[a-fA-F0-9]{40}$/.test(value.trim()),
    resolveNamedAddress: (...args) => mockResolveNamedAddress(...args),
    reverseResolveAddress: (...args) => mockReverseResolveAddress(...args),
    resolveNamedProfile: jest.fn(),
};

const getNamedAddressSupport: GetNamedAddressSupport =
    mockGetNamedAddressSupport(namedAddressResolver);

const queryOptions = (value: string, symbol: NetworkSymbol | null) =>
    getResolveNamedAddressQueryOptions({ getNamedAddressSupport, value, symbol });

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
            expect(queryOptions('  vitalik.eth  ', ethSymbol).queryKey).toEqual(
                queryOptions('vitalik.eth', ethSymbol).queryKey,
            );
        });

        it('keys each network separately', () => {
            expect(queryOptions('vitalik.eth', ethSymbol).queryKey).not.toEqual(
                queryOptions('vitalik.eth', tsepSymbol).queryKey,
            );
        });

        it('keys each value separately', () => {
            expect(queryOptions('vitalik.eth', ethSymbol).queryKey).not.toEqual(
                queryOptions('nick.eth', ethSymbol).queryKey,
            );
        });

        it('keys a missing symbol without colliding with a real one', () => {
            expect(queryOptions('vitalik.eth', null).queryKey).not.toEqual(
                queryOptions('vitalik.eth', ethSymbol).queryKey,
            );
        });
    });

    describe('caching', () => {
        it('resolves the same name once across repeated fetches', async () => {
            mockResolveNamedAddress.mockResolvedValue(RESOLVED_HEX);

            const options = queryOptions('vitalik.eth', ethSymbol);
            await queryClient.ensureQueryData(options);
            await queryClient.ensureQueryData(options);

            expect(mockResolveNamedAddress).toHaveBeenCalledTimes(1);
        });

        // The form validator passes the raw input while the hook passes the trimmed one; both
        // must land on the same entry or a padded paste costs two round trips.
        it('shares one cache entry between a padded and a trimmed value', async () => {
            mockResolveNamedAddress.mockResolvedValue(RESOLVED_HEX);

            await queryClient.ensureQueryData(queryOptions('  vitalik.eth  ', ethSymbol));
            const cached = await queryClient.ensureQueryData(
                queryOptions('vitalik.eth', ethSymbol),
            );

            expect(cached).toBe(RESOLVED_HEX);
            expect(mockResolveNamedAddress).toHaveBeenCalledTimes(1);
        });

        it('trims the value before handing it to the resolver', async () => {
            mockResolveNamedAddress.mockResolvedValue(RESOLVED_HEX);

            await queryClient.ensureQueryData(queryOptions('  vitalik.eth  ', ethSymbol));

            expect(mockResolveNamedAddress).toHaveBeenCalledWith('vitalik.eth', ethSymbol);
        });

        it('refetches once the entry is invalidated', async () => {
            mockResolveNamedAddress.mockResolvedValue(RESOLVED_HEX);

            const options = queryOptions('vitalik.eth', ethSymbol);
            await queryClient.ensureQueryData(options);
            queryClient.removeQueries({ queryKey: options.queryKey });
            await queryClient.ensureQueryData(options);

            expect(mockResolveNamedAddress).toHaveBeenCalledTimes(2);
        });

        it('does not resolve a different name from the cached one', async () => {
            mockResolveNamedAddress.mockResolvedValue(RESOLVED_HEX);

            await queryClient.ensureQueryData(queryOptions('vitalik.eth', ethSymbol));
            await queryClient.ensureQueryData(queryOptions('nick.eth', ethSymbol));

            expect(mockResolveNamedAddress).toHaveBeenCalledTimes(2);
        });
    });

    describe('mode dispatch', () => {
        it('forward-resolves a name', async () => {
            mockResolveNamedAddress.mockResolvedValue(RESOLVED_HEX);

            await queryClient.ensureQueryData(queryOptions('vitalik.eth', ethSymbol));

            expect(mockResolveNamedAddress).toHaveBeenCalledTimes(1);
            expect(mockReverseResolveAddress).not.toHaveBeenCalled();
        });

        it('reverse-resolves a hex address', async () => {
            mockReverseResolveAddress.mockResolvedValue('vitalik.eth');

            await queryClient.ensureQueryData(queryOptions(RESOLVED_HEX, ethSymbol));

            expect(mockReverseResolveAddress).toHaveBeenCalledWith(RESOLVED_HEX, ethSymbol);
            expect(mockResolveNamedAddress).not.toHaveBeenCalled();
        });

        it('rejects rather than resolving an unsupported symbol', async () => {
            await expect(
                queryClient.ensureQueryData(queryOptions('vitalik.eth', btcSymbol)),
            ).rejects.toThrow('Unsupported resolve mode: idle');
            expect(mockResolveNamedAddress).not.toHaveBeenCalled();
        });
    });
});
