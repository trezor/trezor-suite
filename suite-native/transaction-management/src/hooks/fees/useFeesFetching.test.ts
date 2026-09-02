import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import { type FeesStatus } from '@suite-common/wallet-types';
import {
    type TestStore,
    createStoreFromPreloadedState,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';

import { useFeesFetching } from './useFeesFetching';
import { getWalletState } from '../../__fixtures__/walletState';

// Mock the fee hooks since they have side effects and we want to test the hook's logic
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    useFetchFeesOnce: jest.fn(),
    useRefetchFees: jest.fn(),
    selectAccountByKey: jest.fn(),
    selectAreFeesLoading: jest.fn(),
}));

const mockUseFetchFeesOnce = jest.requireMock('@suite-common/wallet-core').useFetchFeesOnce;
const mockUseRefetchFees = jest.requireMock('@suite-common/wallet-core').useRefetchFees;
const mockSelectAreFeesLoading = jest.requireMock('@suite-common/wallet-core').selectAreFeesLoading;
const btcSymbol = asNetworkSymbol('btc');

// Add fees to the wallet state for testing
const getWalletStateWithFees = () => ({
    ...getWalletState(),
    fees: {
        btc: {
            status: 'loaded' as FeesStatus,
        },
        eth: {
            status: 'loaded' as FeesStatus,
        },
    },
});

describe('useFeesFetching', () => {
    const createMockState = (overrides: Record<string, unknown> = {}) => ({
        wallet: getWalletStateWithFees(),
        ...overrides,
    });

    const renderUseFeesFetching = async ({
        store,
        networkSymbol,
        isRefetchDisabled = false,
    }: {
        store: TestStore;
        networkSymbol?: NetworkSymbol;
        isRefetchDisabled?: boolean;
    }) =>
        await renderHookWithStoreProvider(
            () => useFeesFetching({ networkSymbol, isRefetchDisabled }),
            {
                store,
            },
        );

    beforeEach(() => {
        jest.clearAllMocks();
        // Default mock implementations
        mockUseFetchFeesOnce.mockImplementation(() => {});
        mockUseRefetchFees.mockImplementation(() => {});
        mockSelectAreFeesLoading.mockReturnValue(false);
    });

    it('should select account by key from state', async () => {
        const store = createStoreFromPreloadedState(createMockState());
        const { result } = await renderUseFeesFetching({ store, networkSymbol: btcSymbol });

        expect(result.current.areFeesLoading).toBe(false);
        expect(mockUseFetchFeesOnce).toHaveBeenCalledWith({ networkSymbol: btcSymbol });
        expect(mockUseRefetchFees).toHaveBeenCalledWith({
            networkSymbol: btcSymbol,
            isDisabled: false,
        });
    });

    it('should handle loading state correctly', async () => {
        mockSelectAreFeesLoading.mockReturnValue(true);
        const store = createStoreFromPreloadedState(createMockState());
        const { result } = await renderUseFeesFetching({ store, networkSymbol: btcSymbol });

        expect(result.current.areFeesLoading).toBe(true);
        expect(mockUseFetchFeesOnce).toHaveBeenCalledWith({ networkSymbol: btcSymbol });
        expect(mockUseRefetchFees).toHaveBeenCalledWith({
            networkSymbol: btcSymbol,
            isDisabled: false,
        });
    });

    it('should handle refetch disabled correctly', async () => {
        const store = createStoreFromPreloadedState(createMockState());
        const { result } = await renderUseFeesFetching({
            store,
            networkSymbol: btcSymbol,
            isRefetchDisabled: true,
        });

        expect(result.current.areFeesLoading).toBe(false);
        expect(mockUseFetchFeesOnce).toHaveBeenCalledWith({ networkSymbol: btcSymbol });
        expect(mockUseRefetchFees).toHaveBeenCalledWith({
            networkSymbol: btcSymbol,
            isDisabled: true,
        });
    });

    it('should handle undefined networkSymbol gracefully', async () => {
        const store = createStoreFromPreloadedState(createMockState());
        const { result } = await renderUseFeesFetching({
            store,
            networkSymbol: undefined,
        });

        expect(result.current.areFeesLoading).toBe(false);
        expect(mockUseFetchFeesOnce).toHaveBeenCalledWith({ networkSymbol: undefined });
        expect(mockUseRefetchFees).toHaveBeenCalledWith({
            networkSymbol: undefined,
            isDisabled: false,
        });
    });
});
