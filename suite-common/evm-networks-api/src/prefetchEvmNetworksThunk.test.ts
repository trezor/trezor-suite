import { createQueryClient } from '@suite-common/react-query';
import { createMockDispatch } from '@trezor/redux-utils/mocks';

import { findEvmNetworkByChainId, getCachedEvmNetworks } from './evmNetworksQuery';
import {
    type PrefetchEvmNetworksThunkDeps,
    prefetchEvmNetworksThunk,
} from './prefetchEvmNetworksThunk';

const mockGetEvmNetworksFixture = jest.fn();

jest.mock('./evmNetworksFixture', () => ({
    getEvmNetworksFixture: () => mockGetEvmNetworksFixture(),
}));

const createExtra = (): PrefetchEvmNetworksThunkDeps => ({
    services: { queryClient: createQueryClient({ shouldRefetchOnEvents: true }) },
});

const runPrefetch = async (extra: PrefetchEvmNetworksThunkDeps) => {
    const getState = () => ({});
    const { dispatch } = createMockDispatch({ getState, extra });

    await prefetchEvmNetworksThunk()(dispatch, getState, extra);
};

describe(prefetchEvmNetworksThunk.name, () => {
    beforeEach(() => {
        mockGetEvmNetworksFixture
            .mockReset()
            .mockImplementation(jest.requireActual('./evmNetworksFixture').getEvmNetworksFixture);
    });

    it('queries the networks once per app run', async () => {
        const extra = createExtra();

        await runPrefetch(extra);
        await runPrefetch(extra);

        const networks = getCachedEvmNetworks(extra.services.queryClient);

        expect(mockGetEvmNetworksFixture).toHaveBeenCalledTimes(1);
        expect(findEvmNetworkByChainId(networks, 534352)?.simulationSupport).toBe(true);
        expect(findEvmNetworkByChainId(networks, 1)).toBeUndefined();
    });

    it('resolves without networks when the query fails', async () => {
        mockGetEvmNetworksFixture.mockImplementation(() => {
            throw new Error('unavailable');
        });
        const extra = createExtra();

        await expect(runPrefetch(extra)).resolves.toBeUndefined();
        expect(getCachedEvmNetworks(extra.services.queryClient)).toBeUndefined();
    });
});
