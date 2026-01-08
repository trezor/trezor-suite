import type { TokenAddress } from '@suite-common/wallet-types';
import { type TestStore, initStore, renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { DeviceGuardedReviewOutputs } from '../DeviceGuardedReviewOutputs';

const mockNavigation = {
    popToTop: jest.fn(),
    setOptions: jest.fn(),
} as any;

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => mockNavigation,
    useRoute: () => ({ name: 'TEST_ROUTE_NAME' }),
}));

jest.mock('@suite-native/device', () => ({
    ...jest.requireActual('@suite-native/device'),
    useConfirmOnTrezorController: () => ({
        confirmOnTrezorRef: { current: null },
        closeSheet: jest.fn(),
    }),
    ConfirmOnTrezorWrapper: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockUseTradingOutputsReviewScreenControls = jest.fn((_: any) => ({
    isTransactionAlreadySigned: false,
    confirmOnTrezorRef: { current: null },
}));

jest.mock('../../../hooks/reviewOutputs/useTradingOutputsReviewScreenControls', () => ({
    useTradingOutputsReviewScreenControls: (args: any) =>
        mockUseTradingOutputsReviewScreenControls(args),
}));

let mockSelectIsDeviceConnected: boolean;

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    selectIsDeviceConnected: () => mockSelectIsDeviceConnected,
}));

describe('DeviceGuardedReviewOutputs', () => {
    let store: TestStore;

    const renderDeviceGuardedReviewOutputs = () =>
        renderWithStoreProviderAsync(
            <DeviceGuardedReviewOutputs
                orderId="ORDER_ID"
                accountKey="ACCOUNT_KEY"
                reportToAnalytics={jest.fn()}
                tradingType="exchange"
                isTransactionSendConsentRequested={true}
                tokenContract={'TOKEN_CONTRACT' as TokenAddress}
                resolveTransactionSendConsent={jest.fn()}
                signAndSendTransaction={jest.fn()}
            />,
            { store },
        );

    beforeEach(() => {
        jest.clearAllMocks();
        mockSelectIsDeviceConnected = false;
        ({ store } = initStore());
    });

    it('should display connect trezor info when no device is connected', async () => {
        const { getByText, queryByTestId } = await renderDeviceGuardedReviewOutputs();

        expect(getByText('Connect & unlock your Trezor')).toBeOnTheScreen();
        expect(queryByTestId('@trading/outputs-review')).not.toBeOnTheScreen();
    });

    it('should display ReviewOutputs otherwise', async () => {
        mockSelectIsDeviceConnected = true;
        const { queryByText, getByTestId } = await renderDeviceGuardedReviewOutputs();

        expect(queryByText('Connect & unlock your Trezor')).not.toBeOnTheScreen();
        expect(getByTestId('@trading/outputs-review')).toBeOnTheScreen();
    });
});
