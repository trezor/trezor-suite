import { RouteProp } from '@react-navigation/native';
import type { BuyTrade } from 'invity-api';

import { TradingType } from '@suite-common/trading';
import { TradingStackParamList, TradingStackRoutes } from '@suite-native/navigation';
import { PreloadedState, fireEvent, renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { getBuyTrade, getExchangeTrade } from '../../__fixtures__/trades';
import { getInitializedTradingState } from '../../__fixtures__/tradingState';
import { TradeHistoryScreen } from '../TradeHistoryScreen';

const mockNavigation = {
    navigate: jest.fn(),
};

let mockRouteParams: {
    tradeType: TradingType;
} = { tradeType: 'buy' };

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => mockNavigation,
    useRoute: () =>
        ({
            params: { ...mockRouteParams },
        }) as RouteProp<TradingStackParamList, TradingStackRoutes.TradeHistory>,
}));

const buyTrade = getBuyTrade({ status: 'SUBMITTED' });

const renderScreen = (preloadedState: PreloadedState) =>
    renderWithStoreProviderAsync(<TradeHistoryScreen />, {
        preloadedState,
    });

describe('TradeHistoryScreen', () => {
    it('should render list of buy trades', async () => {
        const preloadedState = {
            wallet: {
                tradingNew: {
                    ...getInitializedTradingState(),
                    trades: [buyTrade],
                },
            },
        };
        mockRouteParams = { tradeType: 'buy' };

        const { getByText } = await renderScreen(preloadedState);

        await expect(getByText('Mercuryo')).toBeDefined();
        expect(getByText('1234 USD')).toBeDefined();
        expect(getByText('0.462586 ETH')).toBeDefined();
    });

    it('should render list of exchange trades', async () => {
        const preloadedState = {
            wallet: {
                tradingNew: {
                    ...getInitializedTradingState(),
                    trades: [getExchangeTrade({ status: 'CONVERTING' })],
                },
            },
        };
        mockRouteParams = { tradeType: 'exchange' };

        const { getByText } = await renderScreen(preloadedState);

        expect(getByText('Converting')).toBeDefined();
        expect(getByText('Trans. ID: 12ffba9e-7370-4a6e-87dc-aefd3851c735')).toBeDefined();
    });

    it('should navigate to webview when buy trade is selected', async () => {
        const preloadedState = {
            wallet: {
                tradingNew: {
                    ...getInitializedTradingState(),
                    trades: [buyTrade],
                },
            },
        };
        mockRouteParams = { tradeType: 'buy' };

        const { getByText } = await renderScreen(preloadedState);

        fireEvent.press(getByText('Mercuryo'));

        expect(mockNavigation.navigate).toHaveBeenCalledWith('TradingWebView', {
            closeCallbackUrl:
                'suitetrading://buy/trade?orderId=d3ef3451-8f68-4250-9e08-580ece5e7d12',
            source: { uri: (buyTrade.data as BuyTrade).partnerData },
        });
    });
});
