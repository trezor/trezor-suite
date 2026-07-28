import { getTranslation } from '@suite-native/intl';
import { fireEvent } from '@suite-native/test-utils-store';
import { accounts, getBuyTrade } from '@suite-native/trading-fixtures';

import { TradingHistory } from './TradingHistory';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderWithTradingHistoryProvider,
} from '../__tests__/tradingHistoryTestUtils';

const mockShowSheet = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () => ({
        params: undefined,
    }),
}));

jest.mock('@suite-native/trading-atoms', () => ({
    ...jest.requireActual('@suite-native/trading-atoms'),
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

const overrides: PreloadedStatePartial<TradingTestPreloadedState> = {
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
            trades: [getBuyTrade({ status: 'SUBMITTED' })],
        },
        accounts,
    },
};

describe('TradingHistoryScreen', () => {
    let unmount: (() => void) | undefined;

    const renderTradingHistory = () => {
        const result = renderWithTradingHistoryProvider(<TradingHistory />, { overrides });

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

        expect(getByText('Mercuryo')).toBeTruthy();
        expect(getByText('$1,234.00')).toBeTruthy();
        expect(getByText('0.462586 ETH')).toBeTruthy();
    });

    it('should show bottom sheet when trade item is clicked', () => {
        const { getByText, queryAllByText } = renderTradingHistory();

        fireEvent.press(
            getByText(
                getTranslation('moduleTrading.tradeHistory.transactionId', {
                    orderId: 'd3ef3451-8f68-4250-9e08-580ece5e7d12',
                }),
            ),
        );

        expect(mockShowSheet).toHaveBeenCalledTimes(1);

        expect(getByText(getTranslation('moduleTrading.tradeHistory.detail.paid'))).toBeTruthy();
        // one for history list and one for detail in sheet
        expect(queryAllByText('0.462586 ETH').length).toBe(2);
    });
});
