import { type RouteProp } from '@react-navigation/native';

import { getTranslation } from '@suite-native/intl';
import { type TradingStackParamList, type TradingStackRoutes } from '@suite-native/navigation';
import { renderWithStoreProvider } from '@suite-native/test-utils';
import {
    accounts,
    exchangeQuotes,
    getInitializedTradingState,
} from '@suite-native/trading-fixtures';

import { TradingExchangeRevokeScreen } from '../TradingExchangeRevokeScreen';

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () =>
        ({
            params: undefined,
        }) as RouteProp<TradingStackParamList, TradingStackRoutes.TradingHistory>,
    useNavigation: () => ({
        setOptions: jest.fn(),
    }),
}));

let mockIsDeviceConnected = true;
jest.mock('@suite-common/device', () => ({
    ...jest.requireActual('@suite-common/device'),
    selectIsDeviceConnected: () => mockIsDeviceConnected,
}));

const testQuote = exchangeQuotes[0];

const preloadedState = {
    wallet: {
        trading: {
            ...getInitializedTradingState('exchange'),
            exchange: {
                ...getInitializedTradingState('exchange').exchange,
                selectedQuote: testQuote,
                tradingAccountKey: accounts[0].key,
            },
        },
        accounts,
    },
};

describe('TradingExchangeRevokeScreen', () => {
    let unmount: (() => void) | undefined;

    const renderScreen = () => {
        const result = renderWithStoreProvider(
            <TradingExchangeRevokeScreen
                route={
                    { params: { quote: testQuote } } as RouteProp<
                        TradingStackParamList,
                        TradingStackRoutes.TradingExchangeRevoke
                    >
                }
                navigation={{} as any}
            />,
            {
                preloadedState,
            },
        );

        ({ unmount } = result);

        return result;
    };

    beforeEach(() => {
        jest.clearAllMocks();

        mockIsDeviceConnected = true;
    });

    afterEach(() => {
        if (unmount) {
            unmount();
            unmount = undefined;
        }
    });

    it('should render the revoke screen with quote details', () => {
        const { getByText } = renderScreen();

        expect(getByText('BTC Account #1')).toBeOnTheScreen();
        expect(getByText('Mercuryo')).toBeOnTheScreen();
        expect(getByText('$4.76')).toBeOnTheScreen(); // Fixed fee TODO value
    });

    it('should show network information when network symbol is available', () => {
        const { getByText } = renderScreen();

        expect(getByText('Ethereum')).toBeOnTheScreen();
    });

    it('should display provider information correctly', () => {
        const { getByText } = renderScreen();

        expect(getByText('Mercuryo')).toBeOnTheScreen();
    });

    it('should show current limit and new limit with crypto icon', () => {
        const { getByText, getAllByText } = renderScreen();

        expect(getByText('Current limit')).toBeOnTheScreen();
        expect(getByText('New limit')).toBeOnTheScreen();
        const usdcElements = getAllByText('0 USDC');
        expect(usdcElements).toHaveLength(2);
    });

    it('should render continue button', () => {
        const { getByText } = renderScreen();

        const buttons = getByText('Continue');
        expect(buttons).toBeTruthy();
    });

    it('should display warning alert about revoking permissions', () => {
        const { getByText } = renderScreen();

        expect(
            getByText(
                'This stops the provider from using your USDC. You’ll need to approve again to swap.',
            ),
        ).toBeOnTheScreen();
    });

    it('should display device guard when device is not connected', () => {
        mockIsDeviceConnected = false;

        const { getByText } = renderScreen();

        expect(
            getByText(getTranslation('moduleConnectDevice.connectAndUnlockScreen.title')),
        ).toBeOnTheScreen();
    });
});
