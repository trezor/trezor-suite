import { Text } from 'react-native';

import { getTranslation } from '@suite-native/intl';
import { type TestStore, renderWithStoreProvider } from '@suite-native/test-utils-store';

import { createTradingTestStore } from '../../../__tests__/tradingTestUtils';
import { TradingDeviceConnectionGuard } from '../TradingDeviceConnectionGuard';

const mockNavigation = {
    popToTop: jest.fn(),
    setOptions: jest.fn(),
} as any;

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => mockNavigation,
    useRoute: () => ({ name: 'TEST_ROUTE_NAME' }),
}));

let mockSelectIsDeviceConnected: boolean;

jest.mock('@suite-common/device', () => ({
    ...jest.requireActual('@suite-common/device'),
    selectIsDeviceConnected: () => mockSelectIsDeviceConnected,
}));

describe('TradingDeviceConnectionGuard', () => {
    let store: TestStore;

    const renderTradingDeviceConnectionGuard = () =>
        renderWithStoreProvider(
            <TradingDeviceConnectionGuard>
                <Text>CHILDREN</Text>
            </TradingDeviceConnectionGuard>,
            { store },
        );

    beforeEach(() => {
        jest.clearAllMocks();
        mockSelectIsDeviceConnected = false;
        store = createTradingTestStore();
    });

    it('should display connect trezor info when no device is connected', () => {
        mockSelectIsDeviceConnected = false;
        const { getByText, queryByText } = renderTradingDeviceConnectionGuard();

        expect(
            getByText(getTranslation('moduleConnectDevice.connectAndUnlockScreen.title')),
        ).toBeOnTheScreen();
        expect(queryByText('CHILDREN')).not.toBeOnTheScreen();
    });

    it('should display children when device is connected', () => {
        mockSelectIsDeviceConnected = true;
        const { getByText, queryByText } = renderTradingDeviceConnectionGuard();

        expect(
            queryByText(getTranslation('moduleConnectDevice.connectAndUnlockScreen.title')),
        ).not.toBeOnTheScreen();
        expect(getByText('CHILDREN')).toBeOnTheScreen();
    });
});
