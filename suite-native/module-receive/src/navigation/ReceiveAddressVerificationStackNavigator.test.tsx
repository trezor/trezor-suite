import { Text } from 'react-native';

import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { ReceiveAddressVerificationSource, ReceiveStackRoutes } from '@suite-native/navigation';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import { ReceiveAddressVerificationStackNavigator } from './ReceiveAddressVerificationStackNavigator';

const mockIsDeviceConnectionGuardVisible = jest.fn().mockReturnValue(false);

jest.mock('@suite-native/device-authorization', () => ({
    DeviceConnectionGuardScreen: () => <Text>Connect device</Text>,
    useDeviceConnectionGuard: () => ({
        isDeviceConnectionGuardVisible: mockIsDeviceConnectionGuardVisible(),
    }),
}));

jest.mock('../screens/ReceiveAddressVerificationScreen', () => ({
    ReceiveAddressVerificationScreen: () => <Text>Continue on Trezor</Text>,
}));

describe('ReceiveAddressVerificationStackNavigator', () => {
    const accountKey = mockAccountKey();
    const addressPath = "m/84'/0'/0'/0/0";
    const route = {
        key: 'receive-address-verification',
        name: ReceiveStackRoutes.ReceiveAddressVerification,
        params: {
            accountKey,
            addressPath,
            source: ReceiveAddressVerificationSource.Pasted,
        },
    } as const;

    const renderNavigator = async () =>
        await renderWithBasicProvider(
            <ReceiveAddressVerificationStackNavigator navigation={{} as never} route={route} />,
        );

    beforeEach(() => {
        jest.clearAllMocks();
        mockIsDeviceConnectionGuardVisible.mockReturnValue(false);
    });

    it('shows the continuation screen immediately when the device is ready', async () => {
        const { findByText } = await renderNavigator();

        expect(await findByText('Continue on Trezor')).toBeTruthy();
    });

    it('shows the connection guard until the device is ready', async () => {
        mockIsDeviceConnectionGuardVisible.mockReturnValue(true);
        const { findByText, rerender } = await renderNavigator();

        expect(await findByText('Connect device')).toBeTruthy();

        mockIsDeviceConnectionGuardVisible.mockReturnValue(false);
        await rerender(
            <ReceiveAddressVerificationStackNavigator navigation={{} as never} route={route} />,
        );

        expect(await findByText('Continue on Trezor')).toBeTruthy();
    });
});
