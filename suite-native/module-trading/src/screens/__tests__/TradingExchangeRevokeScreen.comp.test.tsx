import { RouteProp } from '@react-navigation/native';

import { Account } from '@suite-common/wallet-types';
import { TradingStackParamList, TradingStackRoutes } from '@suite-native/navigation';
import { renderWithStoreProviderAsync } from '@suite-native/test-utils';

import fixturesAccounts from '../../__fixtures__/accounts.json';
import { exchangeQuotes } from '../../__fixtures__/exchangeQuotes';
import { getInitializedTradingState } from '../../__fixtures__/tradingState';
import { TradingExchangeRevokeScreen } from '../TradingExchangeRevokeScreen';

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () =>
        ({
            params: undefined,
        }) as RouteProp<TradingStackParamList, TradingStackRoutes.TradingHistory>,
}));

const accounts = fixturesAccounts as Account[];
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

const renderScreen = () =>
    renderWithStoreProviderAsync(<TradingExchangeRevokeScreen />, {
        preloadedState,
    });

describe('TradingExchangeRevokeScreen', () => {
    it('should render the revoke screen with quote details', async () => {
        const { getByText } = await renderScreen();

        expect(getByText('BTC Account #1')).toBeOnTheScreen();
        expect(getByText('Mercuryo')).toBeOnTheScreen();
        expect(getByText('$4.76')).toBeOnTheScreen(); // Fixed fee TODO value
    });

    it('should show network information when network symbol is available', async () => {
        const { getByText } = await renderScreen();

        expect(getByText('Ethereum')).toBeOnTheScreen();
    });

    it('should display provider information correctly', async () => {
        const { getByText } = await renderScreen();

        expect(getByText('Mercuryo')).toBeOnTheScreen();
    });

    it('should show current limit and new limit with crypto icon', async () => {
        const { getByText } = await renderScreen();

        expect(getByText('Current limit')).toBeOnTheScreen();
        expect(getByText('New limit')).toBeOnTheScreen();
        expect(getByText('0 USDC')).toBeOnTheScreen();
    });

    it('should render continue button', async () => {
        const { getByText } = await renderScreen();

        const buttons = getByText('Continue');
        expect(buttons).toBeTruthy();
    });

    it('should display warning alert about revoking permissions', async () => {
        const { getByText } = await renderScreen();

        expect(
            getByText(
                'This stops the provider from using your USDC. You’ll need to approve again to swap.',
            ),
        ).toBeOnTheScreen();
    });
});
