import { getBuyTrade, getExchangeTrade, getSellTrade } from '@suite-native/trading-fixtures';

import { TradingHistoryDetailWatcher } from './TradingHistoryDetailWatcher';
import { renderWithTradingProvider } from '../../test-utils/tradingTestUtils';

const mockUseWatchTrade = jest.fn();
let mockIsFocused = true;

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useIsFocused: () => mockIsFocused,
}));

jest.mock('../../hooks/general/useWatchTrade', () => ({
    useWatchTrade: (props: unknown) => mockUseWatchTrade(props),
}));

describe('TradingHistoryDetailWatcher', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockIsFocused = true;
    });

    it.each([
        getBuyTrade({ status: 'SUBMITTED' }),
        getSellTrade({ status: 'SEND_CRYPTO' }),
        getExchangeTrade({ status: 'CONVERTING' }),
    ])('should watch a focused $tradeType trade using its associated account', trade => {
        const { orderId } = trade.data;
        if (!orderId) {
            throw new Error('Expected the trade fixture to have an order ID');
        }

        renderWithTradingProvider(<TradingHistoryDetailWatcher orderId={orderId} />, {
            overrides: {
                wallet: {
                    trading: { trades: [trade] },
                },
            },
        });

        const accountKey =
            'selectedAccountKey' in trade ? trade.selectedAccountKey : trade.sendAccountKey;
        expect(mockUseWatchTrade).toHaveBeenCalledWith({
            accountKey,
            orderId,
            isEnabled: true,
            isInProgress: true,
            shouldReportAnalytics: false,
        });
    });

    it('should disable watching when the detail screen is not focused', () => {
        const trade = getBuyTrade({ status: 'SUBMITTED' });
        const { orderId } = trade.data;
        if (!orderId) {
            throw new Error('Expected the trade fixture to have an order ID');
        }
        mockIsFocused = false;

        renderWithTradingProvider(<TradingHistoryDetailWatcher orderId={orderId} />, {
            overrides: {
                wallet: {
                    trading: { trades: [trade] },
                },
            },
        });

        expect(mockUseWatchTrade).toHaveBeenCalledWith(
            expect.objectContaining({
                isEnabled: false,
            }),
        );
    });
});
