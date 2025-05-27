import { RouteProp } from '@react-navigation/native';

import { TradingTransaction, TradingType } from '@suite-common/trading';
import { Account } from '@suite-common/wallet-types';
import { TradingStackParamList, TradingStackRoutes } from '@suite-native/navigation';
import {
    PreloadedState,
    act,
    fireEvent,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils';
import { StaticSessionId } from '@trezor/connect';

import fixturesAccounts from '../../__fixtures__/accounts.json';
import { getBuyTrade, getExchangeTrade } from '../../__fixtures__/trades';
import { getInitializedTradingState } from '../../__fixtures__/tradingState';
import { TradingHistoryScreen } from '../TradingHistoryScreen';

let mockRouteParams: {
    tradeType: TradingType;
} = { tradeType: 'buy' };

const mockShowSheet = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () =>
        ({
            params: { ...mockRouteParams },
        }) as RouteProp<TradingStackParamList, TradingStackRoutes.TradingHistory>,
}));

jest.mock('../../hooks/general/useBottomSheetControls', () => ({
    useBottomSheetControls: () => ({
        showSheet: mockShowSheet,
    }),
}));

jest.mock('@suite-common/trading', () => {
    const actualImplementation = jest.requireActual('@suite-common/trading');

    return {
        ...actualImplementation,
        tradingThunks: {
            ...actualImplementation.tradingThunks,
            watchTradeThunk: () => ({ type: 'mocked-action' }),
        },
    };
});

const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
const exchangeTrade = getExchangeTrade({ status: 'CONVERTING' });

const getPreloadedState = (trades: TradingTransaction[]): PreloadedState => ({
    wallet: {
        tradingNew: {
            ...getInitializedTradingState(),
            trades,
        },
        accounts: fixturesAccounts as Account[],
    },
    device: {
        selectedDevice: {
            state: {
                staticSessionId: 'staticSessionId' as StaticSessionId,
            },
        },
    },
});

const renderScreen = (preloadedState: PreloadedState) =>
    renderWithStoreProviderAsync(<TradingHistoryScreen />, {
        preloadedState,
    });

describe('TradingHistoryScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render list of buy trades', async () => {
        mockRouteParams = { tradeType: 'buy' };

        const { getByText } = await renderScreen(getPreloadedState([buyTrade]));

        await expect(getByText('Mercuryo')).toBeTruthy();
        expect(getByText('$1,234.00')).toBeTruthy();
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
