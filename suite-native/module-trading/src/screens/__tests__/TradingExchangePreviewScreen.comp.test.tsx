import { RouteProp } from '@react-navigation/native';

import { TradingStackParamList, TradingStackRoutes } from '@suite-native/navigation';
import { TestStore, initStore, renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { getBtcAccount } from '../../__fixtures__/account';
import { exchangeQuotes } from '../../__fixtures__/exchangeQuotes';
import { getWalletState } from '../../__fixtures__/walletState';
import {
    TradingExchangePreviewScreen,
    TradingExchangePreviewScreenProps,
} from '../TradingExchangePreviewScreen';

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () =>
        ({
            params: undefined,
        }) as RouteProp<TradingStackParamList, TradingStackRoutes.TradingExchangePreview>,
}));

const mockConfirmTrade = jest.fn().mockResolvedValue(Promise.resolve());
const mockFetchFeesAndCompose = jest.fn();
const mockSignAndSendTransaction = jest.fn();
const mockResolveConsent = jest.fn();

jest.mock('../../hooks/exchange/useExchangeFlow', () => ({
    useExchangeFlow: () => ({
        confirmTrade: mockConfirmTrade,
        fetchFeesAndCompose: mockFetchFeesAndCompose,
        signAndSendTransaction: mockSignAndSendTransaction,
        isConsentRequested: false,
        resolveConsent: mockResolveConsent,
        txnErrorString: null,
    }),
}));

describe('TradingExchangePreviewScreen', () => {
    let store: TestStore;

    const renderTradingExchangePreviewScreen = () =>
        renderWithStoreProviderAsync(
            <TradingExchangePreviewScreen
                navigation={
                    {
                        navigate: jest.fn(),
                    } as unknown as TradingExchangePreviewScreenProps['navigation']
                }
                route={{} as TradingExchangePreviewScreenProps['route']}
            />,
            {
                store,
            },
        );

    beforeEach(async () => {
        jest.clearAllMocks();

        const preloadedState = { wallet: getWalletState({ tradeType: 'exchange' }) };
        preloadedState.wallet.trading.exchange = {
            ...preloadedState.wallet.trading.exchange,
            quotes: exchangeQuotes,
            tradingAccountKey: 'eth-account-1',
            receiveAccountKey: 'btc-account-1',
            receiveAddress: getBtcAccount().addresses?.used[0].address,
            selectedQuote: exchangeQuotes[0],
        };

        store = await initStore(preloadedState);
    });

    it('should render continue button', async () => {
        const { getByText } = await renderTradingExchangePreviewScreen();

        expect(getByText('Continue')).toBeOnTheScreen();
    });

    it('should render screen title correctly', async () => {
        const { getByText } = await renderTradingExchangePreviewScreen();

        expect(getByText('Swap')).toBeOnTheScreen();
    });

    it('should render from and to account labels', async () => {
        const { getByText } = await renderTradingExchangePreviewScreen();

        expect(getByText('From')).toBeOnTheScreen();
        expect(getByText('To')).toBeOnTheScreen();
    });

    it('should render transaction details section', async () => {
        const { getByText } = await renderTradingExchangePreviewScreen();

        expect(getByText('Transaction details')).toBeOnTheScreen();
        expect(getByText('Fee')).toBeOnTheScreen();
    });

    it('should render FeePickerCard when no error and fromAccount and quote are available', async () => {
        const { getByText } = await renderTradingExchangePreviewScreen();

        // Should render the fee picker section
        expect(getByText('Transaction details')).toBeOnTheScreen();
        expect(getByText('Fee')).toBeOnTheScreen();
    });
});
