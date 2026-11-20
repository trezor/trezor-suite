import { toTokenAddress, toTokenSymbol } from '@suite-common/tokens';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type YieldPromoListItem } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import {
    type RootStackParamList,
    type RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import { mock } from '@trezor/dependency-injection';

import { useYieldPromoNavigation } from './useYieldPromoNavigation';

type Navigation = StackNavigationProps<RootStackParamList, RootStackRoutes.YieldNavigator>;
const mockNavigate = mock<Navigation['navigate']>();
let mockAccounts: Account[] = [];
let mockIsViewOnly = false;

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ navigate: mockNavigate }),
}));
jest.mock('@suite-common/device', () => ({
    ...jest.requireActual('@suite-common/device'),
    selectIsDeviceInViewOnlyMode: () => mockIsViewOnly,
}));
jest.mock('@suite-native/accounts', () => ({
    ...jest.requireActual('@suite-native/accounts'),
    useAccountAlerts: () => ({ showViewOnlyAddAccountAlert: jest.fn() }),
}));
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    selectVisibleDeviceAccounts: () => mockAccounts,
}));
jest.mock('@suite-native/earn', () => ({
    ...jest.requireActual('@suite-native/earn'),
    useStablecoinYieldFirmwareUpdateAlert: () => ({ isFirmwareSupported: () => true }),
}));
jest.mock('../../components/earn/EarnPortfolioTrackerGuard', () => ({
    useEarnPortfolioTrackerGuard: () => ({ isPortfolioTrackerDevice: false }),
}));

const account = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
const contract = toTokenAddress('0x0000000000000000000000000000000000000001');
const item: YieldPromoListItem = {
    id: 'opportunity',
    yieldId: 'public-vault',
    vaultName: 'Test vault',
    tokenSymbol: toTokenSymbol('USDT'),
    networkSymbol: account.symbol,
    underlyingTokenContract: contract,
    receiptTokenContract: null,
    contractAddress: contract,
    tokenContractAddress: contract,
    apy: null,
};

const renderNavigation = async () => {
    const services: NativeAnalyticsDep = { analytics: mockNativeAnalytics() };
    const hook = await renderHookWithStoreProvider(useYieldPromoNavigation, {
        services,
        preloadedState: { device: { devices: [], selectedDevice: undefined } },
    });

    return { ...hook, analytics: services.analytics };
};

describe('Yield entry sheet analytics', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockIsViewOnly = false;
        mockAccounts = [account, mockWalletAccount({ symbol: account.symbol, index: 1 })];
    });

    it('reports one account-selection cancellation, including another visit', async () => {
        const { result, analytics } = await renderNavigation();
        for (let visit = 0; visit < 2; visit++) {
            await act(() => result.current.onPromoItemPress(item));
            await act(() => result.current.onSelectAccountDismiss());
            await act(() => result.current.onSelectAccountDismiss());
        }

        expect(jest.mocked(analytics.report).mock.calls.map(([event]) => event)).toEqual(
            Array.from({ length: 2 }, () => [
                {
                    type: 'yield/navigate',
                    payload: {
                        action: 'continue',
                        from: 'earn-dashboard',
                        to: 'choose-account-sheet',
                        networkSymbol: 'eth',
                        vaultId: item.yieldId,
                    },
                },
                {
                    type: 'yield/navigate',
                    payload: {
                        action: 'cancel',
                        from: 'choose-account-sheet',
                        to: 'earn-dashboard',
                        networkSymbol: 'eth',
                        vaultId: item.yieldId,
                    },
                },
            ]).flat(),
        );
    });

    it('does not report account-sheet dismissal after selecting an account as cancellation', async () => {
        const { result, analytics } = await renderNavigation();
        await act(() => result.current.onPromoItemPress(item));
        await act(() => result.current.onAccountPress(account));
        await act(() => result.current.onSelectAccountDismiss());

        expect(analytics.report).toHaveBeenCalledTimes(2);
        expect(analytics.report).toHaveBeenLastCalledWith({
            type: 'yield/navigate',
            payload: {
                action: 'continue',
                from: 'choose-account-sheet',
                to: 'deposit-in-a-nutshell-modal',
                networkSymbol: 'eth',
                vaultId: item.yieldId,
            },
        });
        expect(mockNavigate).toHaveBeenCalledTimes(1);
    });

    it('reports opening and cancelling network activation without leaking the selected account', async () => {
        mockAccounts = [];
        const { result, analytics } = await renderNavigation();
        await act(() => result.current.onPromoItemPress(item));
        await act(() => result.current.onEnableNetworkDismiss());
        await act(() => result.current.onEnableNetworkDismiss());

        expect(jest.mocked(analytics.report).mock.calls.map(([event]) => event)).toEqual([
            {
                type: 'yield/navigate',
                payload: {
                    action: 'continue',
                    from: 'earn-dashboard',
                    to: 'enable-network-sheet',
                    networkSymbol: 'eth',
                    vaultId: item.yieldId,
                },
            },
            {
                type: 'yield/navigate',
                payload: {
                    action: 'cancel',
                    from: 'enable-network-sheet',
                    to: 'earn-dashboard',
                    networkSymbol: 'eth',
                    vaultId: item.yieldId,
                },
            },
        ]);
    });

    it('reports a cancellation when view-only mode prevents network activation', async () => {
        mockAccounts = [];
        mockIsViewOnly = true;
        const { result, analytics } = await renderNavigation();
        await act(() => result.current.onPromoItemPress(item));
        await act(() => result.current.onEnableNetworkPress());
        await act(() => result.current.onEnableNetworkDismiss());
        expect(mockNavigate).not.toHaveBeenCalled();
        expect(analytics.report).toHaveBeenCalledTimes(2);
        expect(analytics.report).toHaveBeenLastCalledWith({
            type: 'yield/navigate',
            payload: {
                action: 'cancel',
                from: 'enable-network-sheet',
                to: 'earn-dashboard',
                networkSymbol: 'eth',
                vaultId: item.yieldId,
            },
        });
    });

    it('does not report continuing network activation as cancellation', async () => {
        mockAccounts = [];
        const { result, analytics } = await renderNavigation();
        await act(() => result.current.onPromoItemPress(item));
        await act(() => result.current.onEnableNetworkPress());
        await act(() => result.current.onEnableNetworkDismiss());

        expect(analytics.report).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledTimes(1);
    });
});
