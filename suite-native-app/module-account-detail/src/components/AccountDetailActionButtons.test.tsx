import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice } from '@suite-native/device';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { AccountDetailActionButtons } from './AccountDetailActionButtons';

/*
 This test is an important specification that the receive functionality must be disabled when device is compromised.
 It must be prevented from showing address, xpubs, buying = any UX flows serving to transfer funds TO device.

 However, the other direction (sending, selling, etc.) must NOT be restricted, allowing user to evacuate their funds to safety!
*/

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ navigate: jest.fn() }),
}));

jest.mock('@suite-native/device', () => ({
    ...jest.requireActual('@suite-native/device'),
    selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice: jest.fn(),
}));

const account = mockWalletAccount({ symbol: asNetworkSymbol('btc') });
const services: NativeAnalyticsDep = { analytics: mockNativeAnalytics(jest.fn()) };
const preloadedState = {
    device: { devices: [], selectedDevice: undefined },
    wallet: { accounts: [account] },
};

const renderActionButtons = (hasFirmwareAuthenticityCheckHardFailed: boolean) => {
    jest.mocked(selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice).mockReturnValue(
        hasFirmwareAuthenticityCheckHardFailed,
    );

    return renderWithStoreProvider(<AccountDetailActionButtons accountKey={account.key} />, {
        preloadedState,
        services,
    });
};

describe('AccountDetailActionButtons', () => {
    it('shows the receive button when the firmware authenticity check has not failed', async () => {
        const { getByTestId } = await renderActionButtons(false);

        expect(getByTestId('@account-detail/receive-button')).toBeTruthy();
    });

    it('hides the receive button when the firmware authenticity check has hard failed', async () => {
        const { queryByTestId } = await renderActionButtons(true);

        expect(queryByTestId('@account-detail/receive-button')).toBeNull();
    });
});
