import { AccountKey, FeesStatus } from '@suite-common/wallet-types';
import {
    PreloadedState,
    TestStore,
    initStore,
    renderHookWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { getBtcAccount, getWalletState } from '../../__fixtures__/walletState';
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
const mockSelectAccountByKey = jest.requireMock('@suite-common/wallet-core').selectAccountByKey;
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
        accountKey = 'btc-account-1',
        isRefetchDisabled = false,
    }: {
        store: TestStore;
        accountKey?: AccountKey;
        isRefetchDisabled?: boolean;
    }) =>
        renderHookWithStoreProviderAsync(() => useFeesFetching({ accountKey, isRefetchDisabled }), {
            store,
        });

    beforeEach(() => {
        jest.clearAllMocks();
        // Default mock implementations
        mockUseFetchFeesOnce.mockImplementation(() => {});
        mockUseRefetchFees.mockImplementation(() => {});
        mockSelectAccountByKey.mockReturnValue(getBtcAccount());
        mockSelectAreFeesLoading.mockReturnValue(false);
    });

    it('should select account by key from state', async () => {
        const store = await initStore(createMockState());
        const { result } = await renderUseFeesFetching({ store });

        expect(result.current.areFeesLoading).toBe(false);
        expect(mockUseFetchFeesOnce).toHaveBeenCalledWith({ networkSymbol: 'btc' });
        expect(mockUseRefetchFees).toHaveBeenCalledWith({
            networkSymbol: 'btc',
            isDisabled: false,
        });
    });

    it('should handle undefined account gracefully', async () => {
        mockSelectAccountByKey.mockReturnValue(undefined);
        const store = await initStore(createMockState());
        const { result } = await renderUseFeesFetching({
            store,
            accountKey: 'non-existent-account' as AccountKey,
        });

        expect(result.current.areFeesLoading).toBe(false);
        expect(mockUseFetchFeesOnce).toHaveBeenCalledWith({ networkSymbol: undefined });
        expect(mockUseRefetchFees).toHaveBeenCalledWith({
            networkSymbol: undefined,
            isDisabled: false,
        });
    });

    it('should handle loading state correctly', async () => {
        mockSelectAreFeesLoading.mockReturnValue(true);
        const store = await initStore(createMockState());
        const { result } = await renderUseFeesFetching({ store });

        expect(result.current.areFeesLoading).toBe(true);
        expect(mockUseFetchFeesOnce).toHaveBeenCalledWith({ networkSymbol: 'btc' });
        expect(mockUseRefetchFees).toHaveBeenCalledWith({
            networkSymbol: 'btc',
            isDisabled: false,
        });
    });

    it('should handle refetch disabled correctly', async () => {
        const store = await initStore(createMockState());
        const { result } = await renderUseFeesFetching({
            store,
            isRefetchDisabled: true,
        });

        expect(result.current.areFeesLoading).toBe(false);
        expect(mockUseFetchFeesOnce).toHaveBeenCalledWith({ networkSymbol: 'btc' });
        expect(mockUseRefetchFees).toHaveBeenCalledWith({
            networkSymbol: 'btc',
            isDisabled: true,
        });
    });
});
