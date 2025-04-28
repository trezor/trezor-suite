import { RouteProp } from '@react-navigation/native';

import { TradingTransaction, TradingType } from '@suite-common/trading';
import { TradingStackParamList, TradingStackRoutes } from '@suite-native/navigation';
import {
    PreloadedState,
    act,
    fireEvent,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { getBuyTrade, getExchangeTrade } from '../../__fixtures__/trades';
import { getInitializedTradingState } from '../../__fixtures__/tradingState';
import { TradeHistoryScreen } from '../TradeHistoryScreen';

let mockRouteParams: {
    tradeType: TradingType;
} = { tradeType: 'buy' };

const mockShowSheet = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () =>
        ({
            params: { ...mockRouteParams },
        }) as RouteProp<TradingStackParamList, TradingStackRoutes.TradeHistory>,
}));

jest.mock('../../hooks/useBottomSheetControls', () => ({
    useBottomSheetControls: () => ({
        showSheet: mockShowSheet,
    }),
}));

const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
const exchangeTrade = getExchangeTrade({ status: 'CONVERTING' });

const getPreloadedState = (trades: TradingTransaction[]): PreloadedState => ({
    wallet: {
        tradingNew: {
            ...getInitializedTradingState(),
            trades,
        },
    },
});

const renderScreen = (preloadedState: PreloadedState) =>
    renderWithStoreProviderAsync(<TradeHistoryScreen />, {
        preloadedState,
    });

describe('TradeHistoryScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render list of buy trades', async () => {
        mockRouteParams = { tradeType: 'buy' };

        const { getByText } = await renderScreen(getPreloadedState([buyTrade]));

        await expect(getByText('Mercuryo')).toBeTruthy();
        expect(getByText('1234 USD')).toBeTruthy();
        expect(getByText('0.462586 ETH')).toBeTruthy();
    });

    it('should render list of exchange trades', async () => {
        mockRouteParams = { tradeType: 'exchange' };

        const { getByText } = await renderScreen(getPreloadedState([exchangeTrade]));

        expect(getByText('Converting')).toBeTruthy();
        expect(getByText('Trans. ID: 12ffba9e-7370-4a6e-87dc-aefd3851c735')).toBeTruthy();
    });

    it('should show bottom sheet when trade item is clicked', async () => {
        mockRouteParams = { tradeType: 'buy' };

        const { getByText, queryAllByText } = await renderScreen(getPreloadedState([buyTrade]));

        await act(() => {
            fireEvent.press(getByText('Trans. ID: d3ef3451-8f68-4250-9e08-580ece5e7d12'));
        });

        expect(mockShowSheet).toHaveBeenCalledTimes(1);

        expect(getByText('You paid')).toBeTruthy();
        // one for history list and one for detail in sheet
        expect(queryAllByText('0.462586 ETH').length).toBe(2);
    });
});
