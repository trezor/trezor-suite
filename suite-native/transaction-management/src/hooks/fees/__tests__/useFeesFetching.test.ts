import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type FeesStatus } from '@suite-common/wallet-types';
import {
    type PreloadedState,
    type TestStore,
    initStore,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';

import { getWalletState } from '../../../__fixtures__/walletState';
import { useFeesFetching } from '../useFeesFetching';

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
    const createMockState = (overrides: Partial<PreloadedState> = {}): PreloadedState => ({
        wallet: getWalletStateWithFees(),
        ...overrides,
    });

    const renderUseFeesFetching = ({
        store,
        networkSymbol,
        isRefetchDisabled = false,
    }: {
        store: TestStore;
        networkSymbol?: NetworkSymbol;
        isRefetchDisabled?: boolean;
    }) =>
        renderHookWithStoreProvider(() => useFeesFetching({ networkSymbol, isRefetchDisabled }), {
            store,
        });

    beforeEach(() => {
        jest.clearAllMocks();
        // Default mock implementations
        mockUseFetchFeesOnce.mockImplementation(() => {});
        mockUseRefetchFees.mockImplementation(() => {});
        mockSelectAreFeesLoading.mockReturnValue(false);
    });

    it('should select account by key from state', () => {
        const { store } = initStore(createMockState());
        const { result } = renderUseFeesFetching({ store, networkSymbol: 'btc' });

        expect(result.current.areFeesLoading).toBe(false);
        expect(mockUseFetchFeesOnce).toHaveBeenCalledWith({ networkSymbol: 'btc' });
        expect(mockUseRefetchFees).toHaveBeenCalledWith({
            networkSymbol: 'btc',
            isDisabled: false,
        });
    });

    it('should handle loading state correctly', () => {
        mockSelectAreFeesLoading.mockReturnValue(true);
        const { store } = initStore(createMockState());
        const { result } = renderUseFeesFetching({ store, networkSymbol: 'btc' });

        expect(result.current.areFeesLoading).toBe(true);
        expect(mockUseFetchFeesOnce).toHaveBeenCalledWith({ networkSymbol: 'btc' });
        expect(mockUseRefetchFees).toHaveBeenCalledWith({
            networkSymbol: 'btc',
            isDisabled: false,
        });
    });

    it('should handle refetch disabled correctly', () => {
        const { store } = initStore(createMockState());
        const { result } = renderUseFeesFetching({
            store,
            networkSymbol: 'btc',
            isRefetchDisabled: true,
        });

        expect(result.current.areFeesLoading).toBe(false);
        expect(mockUseFetchFeesOnce).toHaveBeenCalledWith({ networkSymbol: 'btc' });
        expect(mockUseRefetchFees).toHaveBeenCalledWith({
            networkSymbol: 'btc',
            isDisabled: true,
        });
    });

    it('should handle undefined networkSymbol gracefully', () => {
        const { store } = initStore(createMockState());
        const { result } = renderUseFeesFetching({
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
