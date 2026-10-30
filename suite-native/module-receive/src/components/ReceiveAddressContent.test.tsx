import { useEffect } from 'react';
import { Text } from 'react-native';

import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice } from '@suite-native/device';
import { getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { ReceiveAddressContent } from './ReceiveAddressContent';

/*
 This test is an important specification that the receive functionality must be disabled when device is compromised.
 It must be prevented from showing address, xpubs, buying = any UX flows serving to transfer funds TO device.

 However, the other direction (sending, selling, etc.) must NOT be restricted, allowing user to evacuate their funds to safety!
*/

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn(), canGoBack: () => true }),
    useRoute: () => ({ name: 'ReceiveAddress', key: 'ReceiveAddress', params: {} }),
    useFocusEffect: (effect: () => void) => useEffect(effect, [effect]),
}));

jest.mock('@suite-native/device', () => ({
    ...jest.requireActual('@suite-native/device'),
    selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice: jest.fn(),
}));

jest.mock('../receiveThunks', () => ({
    setCurrentFreshAddressForFlowEntryThunk: () => ({ type: 'mockSetCurrentFreshAddress' }),
}));

// The surrounding address details are irrelevant here; only the actions and the blocking matter.
jest.mock('./ReceiveFreshAddressHeader', () => ({ ReceiveFreshAddressHeader: () => null }));
type MockReceiveAddressCardProps = { address: string };

jest.mock('./ReceiveAddressCard', () => ({
    ReceiveAddressCard: ({ address }: MockReceiveAddressCardProps) => <Text>{address}</Text>,
}));
jest.mock('./ReceiveDestinationTagInfo', () => ({ ReceiveDestinationTagInfo: () => null }));

const account = mockWalletAccount({ symbol: asNetworkSymbol('btc') });
const failedAccount = mockWalletAccount(
    {
        symbol: asNetworkSymbol('btc'),
        descriptor: asAccountDescriptor('failed:0:btc:normal'),
    },
    undefined,
    { failed: true, error: 'Discovery failed' },
);
const services: NativeAnalyticsDep = { analytics: mockNativeAnalytics(jest.fn()) };
const preloadedState = {
    device: { devices: [], selectedDevice: undefined },
    messageSystem: {
        validMessages: { banner: [], context: [], modal: [], feature: [] },
        dismissedMessages: {},
    },
    wallet: { accounts: [account] },
    receive: {
        accounts: {
            [account.key]: {
                touchedAddresses: [],
                currentFreshAddress: {
                    path: "m/84'/0'/0'/0/0",
                    address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
                },
            },
        },
    },
};

const renderReceiveAddressContent = (
    hasFirmwareAuthenticityCheckHardFailed: boolean,
    selectedAccount: Account = account,
) => {
    jest.mocked(selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice).mockReturnValue(
        hasFirmwareAuthenticityCheckHardFailed,
    );

    return renderWithStoreProvider(
        <ReceiveAddressContent accountKey={selectedAccount.key} closeActionType="back" />,
        {
            preloadedState: {
                ...preloadedState,
                wallet: { accounts: [selectedAccount] },
                receive: {
                    accounts: {
                        [selectedAccount.key]: {
                            touchedAddresses: [],
                            currentFreshAddress: selectedAccount.failed
                                ? {
                                      address: selectedAccount.descriptor,
                                      path: selectedAccount.path,
                                  }
                                : preloadedState.receive.accounts[account.key].currentFreshAddress,
                        },
                    },
                },
            },
            services,
        },
    );
};

describe('ReceiveAddressContent', () => {
    it('shows the address actions when the firmware authenticity check has not failed', async () => {
        const { getByText, queryByText } = await renderReceiveAddressContent(false);

        expect(getByText(getTranslation('qrCode.copyButton'))).toBeEnabled();
        expect(getByText(getTranslation('qrCode.shareButton'))).toBeEnabled();
        expect(getByText(getTranslation('moduleReceive.addressActions.verify'))).toBeEnabled();
        expect(
            getByText(preloadedState.receive.accounts[account.key].currentFreshAddress.address),
        ).toBeTruthy();
        expect(
            queryByText(getTranslation('moduleAccountManagement.discoveryFailedBanner.title')),
        ).toBeNull();
        expect(
            queryByText(getTranslation('moduleReceive.deviceCompromisedScreen.title')),
        ).toBeNull();
    });

    it('hides the placeholder address and disables receive actions when discovery fails', async () => {
        const { getByText, queryByText } = await renderReceiveAddressContent(false, failedAccount);

        expect(queryByText(failedAccount.descriptor)).toBeNull();
        expect(
            getByText(getTranslation('moduleAccountManagement.discoveryFailedBanner.title')),
        ).toBeTruthy();
        expect(getByText(getTranslation('qrCode.copyButton'))).toBeDisabled();
        expect(getByText(getTranslation('qrCode.shareButton'))).toBeDisabled();
        expect(getByText(getTranslation('moduleReceive.addressActions.verify'))).toBeDisabled();
    });

    it('blocks receiving when the firmware authenticity check has hard failed', async () => {
        const { getByText, queryByText } = await renderReceiveAddressContent(true);

        expect(
            getByText(getTranslation('moduleReceive.deviceCompromisedScreen.title')),
        ).toBeTruthy();
        expect(queryByText(getTranslation('qrCode.copyButton'))).toBeNull();
        expect(queryByText(getTranslation('qrCode.shareButton'))).toBeNull();
        expect(queryByText(getTranslation('moduleReceive.addressActions.verify'))).toBeNull();
    });
});
