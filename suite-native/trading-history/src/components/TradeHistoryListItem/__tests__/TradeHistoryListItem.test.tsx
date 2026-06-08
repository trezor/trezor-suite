import { type TradingTransaction } from '@suite-common/trading';
import { getBuyTrade } from '@suite-native/trading-fixtures';

import { renderWithTradingHistoryProvider } from '../../../__tests__/tradingHistoryTestUtils';
import { TradeHistoryListItem } from '../TradeHistoryListItem';

describe('TradeHistoryListItem', () => {
    const renderTradeHistoryListItem = (transaction: TradingTransaction) =>
        renderWithTradingHistoryProvider(
            <TradeHistoryListItem transaction={transaction} onPress={jest.fn()} />,
        );

    it('should render trade correctly', () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });

        const { getByText } = renderTradeHistoryListItem(buyTrade);

        expect(getByText('Mercuryo')).toBeTruthy();
        expect(getByText('$1,234.00')).toBeTruthy();
        expect(getByText('0.462586 ETH')).toBeTruthy();
        expect(getByText('Trans. ID: d3ef3451-8f68-4250-9e08-580ece5e7d12')).toBeTruthy();
        expect(getByText('Submitted')).toBeTruthy();
    });

    it('should render date and time', () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });

        const { getByText } = renderTradeHistoryListItem(buyTrade);

        expect(getByText(/0[45]\/10\/2025 at [0-9]{1,2}:21/)).toBeTruthy();
    });
});
