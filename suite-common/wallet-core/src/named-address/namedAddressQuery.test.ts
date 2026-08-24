import { QueryClient } from '@suite-common/react-query';

import { getResolveNamedAddressQueryOptions } from './namedAddressQuery';
import { resolveNamedAddress, reverseResolveAddress } from './resolveNamedAddress';

jest.mock('./resolveNamedAddress', () => ({
    resolveNamedAddress: jest.fn(),
    reverseResolveAddress: jest.fn(),
}));

const mockResolveNamedAddress = jest.mocked(resolveNamedAddress);
const mockReverseResolveAddress = jest.mocked(reverseResolveAddress);

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
            expect(getResolveNamedAddressQueryOptions('  vitalik.eth  ', 'eth').queryKey).toEqual(
                getResolveNamedAddressQueryOptions('vitalik.eth', 'eth').queryKey,
            );
        });

        it('keys each network separately', () => {
            expect(getResolveNamedAddressQueryOptions('vitalik.eth', 'eth').queryKey).not.toEqual(
                getResolveNamedAddressQueryOptions('vitalik.eth', 'tsep').queryKey,
            );
        });

        it('keys each value separately', () => {
            expect(getResolveNamedAddressQueryOptions('vitalik.eth', 'eth').queryKey).not.toEqual(
                getResolveNamedAddressQueryOptions('nick.eth', 'eth').queryKey,
            );
        });

        it('keys a missing symbol without colliding with a real one', () => {
            expect(getResolveNamedAddressQueryOptions('vitalik.eth', null).queryKey).not.toEqual(
                getResolveNamedAddressQueryOptions('vitalik.eth', 'eth').queryKey,
            );
        });
    });

    describe('caching', () => {
        it('resolves the same name once across repeated fetches', async () => {
            mockResolveNamedAddress.mockResolvedValue(RESOLVED_HEX);

            const options = getResolveNamedAddressQueryOptions('vitalik.eth', 'eth');
            await queryClient.ensureQueryData(options);
            await queryClient.ensureQueryData(options);

            expect(mockResolveNamedAddress).toHaveBeenCalledTimes(1);
        });

        // The form validator passes the raw input while the hook passes the trimmed one; both
        // must land on the same entry or a padded paste costs two round trips.
        it('shares one cache entry between a padded and a trimmed value', async () => {
            mockResolveNamedAddress.mockResolvedValue(RESOLVED_HEX);

            await queryClient.ensureQueryData(
                getResolveNamedAddressQueryOptions('  vitalik.eth  ', 'eth'),
            );
            const cached = await queryClient.ensureQueryData(
                getResolveNamedAddressQueryOptions('vitalik.eth', 'eth'),
            );

            expect(cached).toBe(RESOLVED_HEX);
            expect(mockResolveNamedAddress).toHaveBeenCalledTimes(1);
        });

        it('trims the value before handing it to the resolver', async () => {
            mockResolveNamedAddress.mockResolvedValue(RESOLVED_HEX);

            await queryClient.ensureQueryData(
                getResolveNamedAddressQueryOptions('  vitalik.eth  ', 'eth'),
            );

            expect(mockResolveNamedAddress).toHaveBeenCalledWith('vitalik.eth', 'eth');
        });

        it('refetches once the entry is invalidated', async () => {
            mockResolveNamedAddress.mockResolvedValue(RESOLVED_HEX);

            const options = getResolveNamedAddressQueryOptions('vitalik.eth', 'eth');
            await queryClient.ensureQueryData(options);
            queryClient.removeQueries({ queryKey: options.queryKey });
            await queryClient.ensureQueryData(options);

            expect(mockResolveNamedAddress).toHaveBeenCalledTimes(2);
        });

        it('does not resolve a different name from the cached one', async () => {
            mockResolveNamedAddress.mockResolvedValue(RESOLVED_HEX);

            await queryClient.ensureQueryData(
                getResolveNamedAddressQueryOptions('vitalik.eth', 'eth'),
            );
            await queryClient.ensureQueryData(
                getResolveNamedAddressQueryOptions('nick.eth', 'eth'),
            );

            expect(mockResolveNamedAddress).toHaveBeenCalledTimes(2);
        });
    });

    describe('mode dispatch', () => {
        it('forward-resolves a name', async () => {
            mockResolveNamedAddress.mockResolvedValue(RESOLVED_HEX);

            await queryClient.ensureQueryData(
                getResolveNamedAddressQueryOptions('vitalik.eth', 'eth'),
            );

            expect(mockResolveNamedAddress).toHaveBeenCalledTimes(1);
            expect(mockReverseResolveAddress).not.toHaveBeenCalled();
        });

        it('reverse-resolves a hex address', async () => {
            mockReverseResolveAddress.mockResolvedValue('vitalik.eth');

            await queryClient.ensureQueryData(
                getResolveNamedAddressQueryOptions(RESOLVED_HEX, 'eth'),
            );

            expect(mockReverseResolveAddress).toHaveBeenCalledWith(RESOLVED_HEX, 'eth');
            expect(mockResolveNamedAddress).not.toHaveBeenCalled();
        });

        it('rejects rather than resolving an unsupported symbol', async () => {
            await expect(
                queryClient.ensureQueryData(
                    getResolveNamedAddressQueryOptions('vitalik.eth', 'btc'),
                ),
            ).rejects.toThrow('Unsupported resolve mode: idle');
            expect(mockResolveNamedAddress).not.toHaveBeenCalled();
        });
    });
});
