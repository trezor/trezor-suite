import { type TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type useAlert } from '@suite-native/alerts';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { type useBottomSheetModalControls } from '@suite-native/atoms';
import { getTranslation } from '@suite-native/intl';
import {
    AddCoinAccountStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import { mock } from '@trezor/dependency-injection';
import { DeviceModelInternal, FirmwareType } from '@trezor/device-utils';

import { useStakingPromoNavigation } from './useStakingPromoNavigation';

type Navigation = StackNavigationProps<RootStackParamList, RootStackRoutes.StakingManagement>;
type AlertApi = ReturnType<typeof useAlert>;

const mockNavigate = mock<Navigation['navigate']>();
const mockShowAlert = mock<AlertApi['showAlert']>();
const mockHideAlert = mock<AlertApi['hideAlert']>();
const mockOpenSheet = mock<() => void>();
const mockOpenInfoSheet = mock<() => void>();
const mockHideSheet = mock<ReturnType<typeof useBottomSheetModalControls>['hideSheet']>();
const mockOpenPortfolioTrackerSheet = mock<() => void>();
let mockIsPortfolioTrackerDevice = false;
let mockAccounts: Account[] = [];

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ navigate: mockNavigate }),
}));
jest.mock('@suite-native/alerts', () => ({
    ...jest.requireActual('@suite-native/alerts'),
    useAlert: () => ({ showAlert: mockShowAlert, hideAlert: mockHideAlert }),
}));
jest.mock('@suite-native/atoms', () => ({
    ...jest.requireActual('@suite-native/atoms'),
    useBottomSheetModal: () => ({
        bottomSheetRef: { current: null },
        openModal: mockOpenInfoSheet,
    }),
    useBottomSheetModalControls: () => ({
        bottomSheetRef: { current: null },
        showSheet: mockOpenSheet,
        hideSheet: mockHideSheet,
    }),
}));
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    selectVisibleDeviceAccounts: () => mockAccounts,
}));
jest.mock('../../components/earn/EarnPortfolioTrackerGuard', () => ({
    useEarnPortfolioTrackerGuard: () => ({
        isPortfolioTrackerDevice: mockIsPortfolioTrackerDevice,
        openPortfolioTrackerSheet: mockOpenPortfolioTrackerSheet,
    }),
}));

const modelOne = mockSuiteDevice(
    {
        connected: true,
        available: true,
        unavailableCapabilities: {
            [asNetworkSymbol('sol')]: 'no-support',
            [asNetworkSymbol('dsol')]: 'no-support',
            [asNetworkSymbol('ada')]: 'no-support',
            [asNetworkSymbol('trx')]: 'no-support',
        },
    },
    {
        major_version: 1,
        minor_version: 14,
        patch_version: 2,
        internal_model: DeviceModelInternal.T1B1,
    },
);

const renderNavigation = (device: TrezorDevice = modelOne) => {
    const services: NativeAnalyticsDep = { analytics: mockNativeAnalytics() };

    return renderHookWithStoreProvider(useStakingPromoNavigation, {
        services,
        preloadedState: { device: { selectedDevice: device, devices: [device] } },
    });
};

describe('staking promotion device support', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockIsPortfolioTrackerDevice = false;
        mockAccounts = [];
    });

    it.each(['sol', 'dsol', 'ada', 'trx'] as const)(
        'explains unsupported %s instead of offering network activation',
        async symbol => {
            const { result } = await renderNavigation();

            await act(() => result.current.onPromoItemPress(asNetworkSymbol(symbol)));

            expect(mockShowAlert).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: getTranslation('moduleSettings.notSupported'),
                    primaryButtonTitle: getTranslation('generic.buttons.gotIt'),
                    onPressPrimaryButton: mockHideAlert,
                }),
            );
            expect(mockOpenSheet).not.toHaveBeenCalled();
            expect(mockOpenInfoSheet).not.toHaveBeenCalled();
            expect(mockNavigate).not.toHaveBeenCalled();
            expect(result.current.pendingEnableSymbol).toBeNull();
        },
    );

    it('keeps Ethereum activation available on Model One', async () => {
        const { result } = await renderNavigation();
        await act(() => result.current.onPromoItemPress(asNetworkSymbol('eth')));
        await act(() => result.current.onEnableNetworkPress());

        expect(mockShowAlert).not.toHaveBeenCalled();
        expect(mockOpenSheet).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith(RootStackRoutes.AddCoinAccountStack, {
            screen: AddCoinAccountStackRoutes.AddCoinDiscoveryRunning,
            params: {
                networkSymbol: 'eth',
                flowType: 'earn',
                earnFlowParams: { earnType: 'staking' },
            },
        });
    });

    it('allows Solana on a supporting device', async () => {
        const { result } = await renderNavigation(
            mockSuiteDevice({ connected: true, available: true }),
        );
        await act(() => result.current.onPromoItemPress(asNetworkSymbol('sol')));

        expect(mockShowAlert).not.toHaveBeenCalled();
        expect(result.current.pendingEnableSymbol).toBe('sol');
        expect(mockOpenSheet).toHaveBeenCalled();
    });

    it('explains missing firmware capabilities', async () => {
        const device = mockSuiteDevice({
            unavailableCapabilities: { [asNetworkSymbol('sol')]: 'no-capability' },
        });
        const { result } = await renderNavigation(device);
        await act(() => result.current.onPromoItemPress(asNetworkSymbol('sol')));

        expect(mockShowAlert).toHaveBeenCalled();
        expect(mockOpenSheet).not.toHaveBeenCalled();
        expect(mockOpenInfoSheet).not.toHaveBeenCalled();
    });

    it('explains unsupported staking on Bitcoin-only firmware', async () => {
        const { result } = await renderNavigation(
            mockSuiteDevice({ firmwareType: FirmwareType.BitcoinOnly }),
        );
        await act(() => result.current.onPromoItemPress(asNetworkSymbol('eth')));

        expect(mockShowAlert).toHaveBeenCalled();
        expect(mockOpenSheet).not.toHaveBeenCalled();
        expect(mockOpenInfoSheet).not.toHaveBeenCalled();
    });

    it('shows the alert before navigating to an existing unsupported account', async () => {
        mockAccounts = [mockWalletAccount({ symbol: asNetworkSymbol('eth') })];
        const { result } = await renderNavigation(
            mockSuiteDevice({ firmwareType: FirmwareType.BitcoinOnly }),
        );
        await act(() => result.current.onPromoItemPress(asNetworkSymbol('eth')));

        expect(mockShowAlert).toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
        expect(mockOpenSheet).not.toHaveBeenCalled();
        expect(mockOpenInfoSheet).not.toHaveBeenCalled();
    });

    it('keeps Portfolio Tracker exploration behind its existing guard', async () => {
        mockIsPortfolioTrackerDevice = true;
        const { result } = await renderNavigation();
        await act(() => result.current.onPromoItemPress(asNetworkSymbol('sol')));

        expect(mockOpenPortfolioTrackerSheet).toHaveBeenCalled();
        expect(mockShowAlert).not.toHaveBeenCalled();
        expect(mockOpenSheet).not.toHaveBeenCalled();
        expect(mockOpenInfoSheet).not.toHaveBeenCalled();
    });
});
