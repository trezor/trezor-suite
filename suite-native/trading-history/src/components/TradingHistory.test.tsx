import { getTranslation } from '@suite-native/intl';
import { fireEvent, userEvent } from '@suite-native/test-utils-store';
import {
    accounts,
    getBuyTrade,
    getExchangeTrade,
    getSellTrade,
} from '@suite-native/trading-fixtures';

import { TradingHistory } from './TradingHistory';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderWithTradingHistoryProvider,
} from '../test-utils/tradingHistoryTestUtils';

const mockGoBack = jest.fn();
const mockOpenTradeDetail = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
        goBack: mockGoBack,
    }),
    useRoute: () => ({
        params: undefined,
    }),
}));

jest.mock('@suite-native/trading-atoms', () => ({
    ...jest.requireActual('@suite-native/trading-atoms'),
    IconByCryptoId: () => null,
}));

jest.mock('@suite-native/icons', () => ({
    ...jest.requireActual('@suite-native/icons'),
    TokenIcon: () => null,
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

const getOverrides = (
    trades: TradingTestPreloadedState['wallet']['trading']['trades'],
): PreloadedStatePartial<TradingTestPreloadedState> => ({
    device: {
        devices: [],
        selectedDevice: {
            state: {
                staticSessionId: '1@2:3',
            },
        },
    },
    wallet: {
        trading: {
            trades,
        },
        accounts,
    },
});

const defaultBuyTrade = getBuyTrade({ status: 'SUBMITTED' });
const defaultTrades = [
    defaultBuyTrade,
    getExchangeTrade({ status: 'SUCCESS' }),
    getSellTrade({ status: 'ERROR' }),
];

describe('TradingHistoryScreen', () => {
    let unmount: (() => void) | undefined;

    const renderTradingHistory = async ({
        trades = defaultTrades,
    }: {
        trades?: TradingTestPreloadedState['wallet']['trading']['trades'];
    } = {}) => {
        const result = renderWithTradingHistoryProvider(
            <TradingHistory onOpenTradeDetail={mockOpenTradeDetail} />,
            {
                overrides: getOverrides(trades),
            },
        );

        ({ unmount } = await result);

        return result;
    };
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(async () => {
        if (unmount) {
            await unmount();
            unmount = undefined;
        }
    });

    it('should render list of trades', async () => {
        const { getByText } = await renderTradingHistory();

        expect(getByText('$1,234.00')).toBeTruthy();
        expect(getByText('0.462586 ETH')).toBeTruthy();
        expect(getByText('10.1232 JTO')).toBeTruthy();
        expect(getByText('1.22 BTC')).toBeTruthy();
        expect(
            getByText(
                getTranslation('moduleTrading.tradingScreen.footer.termsAndConditionsGeneric'),
            ),
        ).toBeTruthy();
    });

    it('should open the trade detail screen when a trade item is clicked', async () => {
        const { getByText } = await renderTradingHistory();

        await fireEvent.press(getByText('$1,234.00'));

        expect(mockOpenTradeDetail).toHaveBeenCalledWith(defaultBuyTrade.data.orderId);
    });

    it('should filter trades by type', async () => {
        const { getByText, queryByText } = await renderTradingHistory();

        await fireEvent.press(
            getByText(getTranslation('moduleTrading.tradeHistory.tabs.exchange')),
        );

        expect(getByText('10.1232 JTO')).toBeTruthy();
        expect(queryByText('$1,234.00')).toBeNull();
        expect(queryByText('1.22 BTC')).toBeNull();

        await fireEvent.press(getByText(getTranslation('moduleTrading.tradeHistory.tabs.sell')));

        expect(getByText('1.22 BTC')).toBeTruthy();
        expect(queryByText('10.1232 JTO')).toBeNull();
    });

    it('should show the first trade after scrolling and changing the filter', async () => {
        const { getByTestId, getByText } = await renderTradingHistory();
        const list = getByTestId('@trading/history/list');

        await userEvent.scrollTo(list, {
            y: 500,
            contentSize: { width: 400, height: 1_000 },
            layoutMeasurement: { width: 400, height: 500 },
        });
        await userEvent.press(
            getByText(getTranslation('moduleTrading.tradeHistory.tabs.exchange')),
        );

        expect(list).toBeVisible();
        expect(getByText('10.1232 JTO')).toBeVisible();
    });

    it('should show filtered empty state and return to all trades', async () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
        const { getByText, queryByText } = await renderTradingHistory({ trades: [buyTrade] });

        await fireEvent.press(
            getByText(getTranslation('moduleTrading.tradeHistory.tabs.exchange')),
        );

        expect(
            getByText(getTranslation('moduleTrading.tradeHistory.filteredEmptyState.exchange')),
        ).toBeTruthy();
        expect(queryByText('$1,234.00')).toBeNull();
        expect(
            getByText(
                getTranslation('moduleTrading.tradingScreen.footer.termsAndConditionsGeneric'),
            ),
        ).toBeTruthy();

        await fireEvent.press(
            getByText(getTranslation('moduleTrading.tradeHistory.filteredEmptyState.showAll')),
        );

        expect(getByText('$1,234.00')).toBeTruthy();
    });

    it('should show global empty state and return to the trade form', async () => {
        const { getByTestId, getByText, queryByText } = await renderTradingHistory({
            trades: [],
        });

        expect(getByTestId('@trading/history/empty-state/illustration')).toBeTruthy();
        expect(
            getByText(getTranslation('moduleTrading.tradeHistory.emptyState.title')),
        ).toBeTruthy();
        expect(queryByText(getTranslation('moduleTrading.tradeHistory.tabs.all'))).toBeNull();
        expect(
            queryByText(
                getTranslation('moduleTrading.tradingScreen.footer.termsAndConditionsGeneric'),
            ),
        ).toBeNull();

        await fireEvent.press(
            getByText(getTranslation('moduleTrading.tradeHistory.emptyState.button')),
        );

        expect(mockGoBack).toHaveBeenCalledTimes(1);
    });
});
