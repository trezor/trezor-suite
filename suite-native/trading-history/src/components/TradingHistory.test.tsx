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

const mockShowSheet = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
        goBack: mockGoBack,
    }),
    useRoute: () => ({
        params: undefined,
    }),
}));

jest.mock('@suite-native/atoms', () => ({
    ...jest.requireActual('@suite-native/atoms'),
    useBottomSheetControls: () => ({
        showSheet: mockShowSheet,
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

const defaultTrades = [
    getBuyTrade({ status: 'SUBMITTED' }),
    getExchangeTrade({ status: 'SUCCESS' }),
    getSellTrade({ status: 'ERROR' }),
];

describe('TradingHistoryScreen', () => {
    let unmount: (() => void) | undefined;

    const renderTradingHistory = ({
        trades = defaultTrades,
    }: {
        trades?: TradingTestPreloadedState['wallet']['trading']['trades'];
    } = {}) => {
        const result = renderWithTradingHistoryProvider(<TradingHistory />, {
            overrides: getOverrides(trades),
        });

        ({ unmount } = result);

        return result;
    };
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        if (unmount) {
            unmount();
            unmount = undefined;
        }
    });

    it('should render list of trades', () => {
        const { getByText } = renderTradingHistory();

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

    it('should show bottom sheet when trade item is clicked', () => {
        const { getByText, queryAllByText } = renderTradingHistory();

        fireEvent.press(getByText('$1,234.00'));

        expect(mockShowSheet).toHaveBeenCalledTimes(1);

        expect(getByText(getTranslation('moduleTrading.tradeHistory.detail.paid'))).toBeTruthy();
        // one for history list and one for detail in sheet
        expect(queryAllByText('0.462586 ETH').length).toBe(2);
    });

    it('should filter trades by type', () => {
        const { getByText, queryByText } = renderTradingHistory();

        fireEvent.press(getByText(getTranslation('moduleTrading.tradeHistory.tabs.exchange')));

        expect(getByText('10.1232 JTO')).toBeTruthy();
        expect(queryByText('$1,234.00')).toBeNull();
        expect(queryByText('1.22 BTC')).toBeNull();

        fireEvent.press(getByText(getTranslation('moduleTrading.tradeHistory.tabs.sell')));

        expect(getByText('1.22 BTC')).toBeTruthy();
        expect(queryByText('10.1232 JTO')).toBeNull();
    });

    it('should show the first trade after scrolling and changing the filter', async () => {
        const { getByTestId, getByText } = renderTradingHistory();
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

    it('should show filtered empty state and return to all trades', () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
        const { getByText, queryByText } = renderTradingHistory({ trades: [buyTrade] });

        fireEvent.press(getByText(getTranslation('moduleTrading.tradeHistory.tabs.exchange')));

        expect(
            getByText(getTranslation('moduleTrading.tradeHistory.filteredEmptyState.exchange')),
        ).toBeTruthy();
        expect(queryByText('$1,234.00')).toBeNull();
        expect(
            getByText(
                getTranslation('moduleTrading.tradingScreen.footer.termsAndConditionsGeneric'),
            ),
        ).toBeTruthy();

        fireEvent.press(
            getByText(getTranslation('moduleTrading.tradeHistory.filteredEmptyState.showAll')),
        );

        expect(getByText('$1,234.00')).toBeTruthy();
    });

    it('should show global empty state and return to the trade form', () => {
        const { getByTestId, getByText, queryByText } = renderTradingHistory({
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

        fireEvent.press(getByText(getTranslation('moduleTrading.tradeHistory.emptyState.button')));

        expect(mockGoBack).toHaveBeenCalledTimes(1);
    });
});
