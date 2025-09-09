import { RouteProp } from '@react-navigation/native';

import { TradingStackParamList, TradingStackRoutes } from '@suite-native/navigation';
import {
    TestStore,
    initStore,
    renderWithStoreProviderAsync,
    userEvent,
} from '@suite-native/test-utils';

import { getBtcAccount } from '../../__fixtures__/account';
import { exchangeQuotes } from '../../__fixtures__/exchangeQuotes';
import { getWalletState } from '../../__fixtures__/walletState';
import { TradingExchangePreviewScreen } from '../TradingExchangePreviewScreen';

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () =>
        ({
            params: undefined,
        }) as RouteProp<TradingStackParamList, TradingStackRoutes.TradingExchangePreview>,
}));

const mockConfirmTrade = jest.fn().mockResolvedValue(Promise.resolve());

jest.mock('../../hooks/exchange/useExchangeFlow', () => ({
    useExchangeFlow: () => ({
        confirmTrade: mockConfirmTrade,
        fetchFeesAndCompose: jest.fn(),
        signAndSendTransaction: jest.fn(),
        isConsentRequested: false,
        resolveConsent: jest.fn(),
    }),
}));

describe('TradingExchangePreviewScreen', () => {
    let store: TestStore;

    const renderTradingExchangePreviewScreen = () =>
        renderWithStoreProviderAsync(<TradingExchangePreviewScreen />, { store });

    beforeEach(async () => {
        jest.clearAllMocks();

        const preloadedState = { wallet: getWalletState({ tradeType: 'exchange' }) };
        preloadedState.wallet.trading.exchange = {
            ...preloadedState.wallet.trading.exchange,
            quotes: exchangeQuotes,
            tradingAccountKey: 'eth-account-1',
            receiveAccountKey: 'btc-account-1',
            receiveAddress: getBtcAccount().addresses?.used[0],
            selectedQuote: exchangeQuotes[0],
        };

        store = await initStore(preloadedState);
    });

    it('should render continue button', async () => {
        const { getByText } = await renderTradingExchangePreviewScreen();

        expect(getByText('Continue')).toBeOnTheScreen();
    });

    it('should call confirmTrade on Continue press', async () => {
        const { getByText, queryByText } = await renderTradingExchangePreviewScreen();

        await userEvent.press(getByText('Continue'));

        expect(mockConfirmTrade).toHaveBeenCalledTimes(1);
        expect(mockConfirmTrade).toHaveBeenCalledWith({
            sendAccount: expect.objectContaining({ key: 'eth-account-1' }),
            receiveAddress: '1BTC',
            trade: exchangeQuotes[0],
            approvalFlow: false,
        });
        expect(queryByText('Continue')).not.toBeOnTheScreen();
        expect(getByText('Prepare Transaction')).toBeOnTheScreen();
    });
});
