import { type RefObject } from 'react';

import { syncAllAccountsWithBlockchainThunk } from '@suite-native/blockchain';
import { act, renderHookWithStoreProvider, waitFor } from '@suite-native/test-utils-store';

import { useHomeRefreshControl } from './useHomeRefreshControl';
import { type PortfolioGraphRef } from '../components/PortfolioGraph';

jest.mock('@suite-native/blockchain', () => ({
    __esModule: true,
    ...jest.requireActual('@suite-native/blockchain'),
    syncAllAccountsWithBlockchainThunk: jest.fn(() => ({
        type: 'mock/syncAllAccountsWithBlockchainThunk',
    })),
}));

const syncAllAccountsWithBlockchainThunkMock =
    syncAllAccountsWithBlockchainThunk as unknown as jest.Mock;

const createPortfolioGraphRef = (
    refetchGraph: PortfolioGraphRef['refetchGraph'] = jest.fn(),
): RefObject<PortfolioGraphRef | null> => ({ current: { refetchGraph } });

const renderHomeRefreshControlHook = (
    isDiscoveredDeviceAccountless: boolean,
    portfolioGraphRef: RefObject<PortfolioGraphRef | null> = createPortfolioGraphRef(),
) =>
    renderHookWithStoreProvider(() =>
        useHomeRefreshControl({ isDiscoveredDeviceAccountless, portfolioGraphRef }),
    );

describe('useHomeRefreshControl', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns undefined when the discovered device is accountless', () => {
        const { result } = renderHomeRefreshControlHook(true);

        expect(result.current).toBeUndefined();
    });

    it('returns a RefreshControl element when the device has accounts', () => {
        const { result } = renderHomeRefreshControlHook(false);

        expect(result.current?.props.refreshing).toBe(false);
        expect(typeof result.current?.props.onRefresh).toBe('function');
    });

    it('refetches the graph and syncs accounts on refresh, toggling the refreshing state', async () => {
        const refetchGraph = jest.fn().mockResolvedValue(undefined);
        const portfolioGraphRef = createPortfolioGraphRef(refetchGraph);
        const { result } = renderHomeRefreshControlHook(false, portfolioGraphRef);

        act(() => {
            result.current?.props.onRefresh();
        });

        expect(result.current?.props.refreshing).toBe(true);

        await waitFor(() => {
            expect(result.current?.props.refreshing).toBe(false);
        });

        expect(refetchGraph).toHaveBeenCalledWith({ forceRefetch: true });
        expect(syncAllAccountsWithBlockchainThunkMock).toHaveBeenCalledTimes(1);
    });

    it('stops refreshing even when refetching the graph rejects', async () => {
        const refetchGraph = jest.fn().mockRejectedValue(new Error('network error'));
        const portfolioGraphRef = createPortfolioGraphRef(refetchGraph);
        const { result } = renderHomeRefreshControlHook(false, portfolioGraphRef);

        act(() => {
            result.current?.props.onRefresh();
        });

        await waitFor(() => {
            expect(result.current?.props.refreshing).toBe(false);
        });
    });
});
