import { useEffect } from 'react';

import { asNetworkSymbol } from '@suite-common/wallet-config';
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
jest.mock('./ReceiveAddressCard', () => ({ ReceiveAddressCard: () => null }));
jest.mock('./ReceiveDestinationTagInfo', () => ({ ReceiveDestinationTagInfo: () => null }));

const account = mockWalletAccount({ symbol: asNetworkSymbol('btc') });
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

const renderReceiveAddressContent = (hasFirmwareAuthenticityCheckHardFailed: boolean) => {
    jest.mocked(selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice).mockReturnValue(
        hasFirmwareAuthenticityCheckHardFailed,
    );

    return renderWithStoreProvider(
        <ReceiveAddressContent accountKey={account.key} closeActionType="back" />,
        { preloadedState, services },
    );
};

describe('ReceiveAddressContent', () => {
    it('shows the address actions when the firmware authenticity check has not failed', async () => {
        const { getByText, queryByText } = await renderReceiveAddressContent(false);

        expect(getByText(getTranslation('qrCode.copyButton'))).toBeTruthy();
        expect(getByText(getTranslation('qrCode.shareButton'))).toBeTruthy();
        expect(getByText(getTranslation('moduleReceive.addressActions.verify'))).toBeTruthy();
        expect(
            queryByText(getTranslation('moduleReceive.deviceCompromisedScreen.title')),
        ).toBeNull();
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
