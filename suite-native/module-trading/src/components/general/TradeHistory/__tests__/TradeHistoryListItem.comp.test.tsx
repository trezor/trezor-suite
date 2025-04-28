import { TradingTransaction } from '@suite-common/trading';
import { renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { getBuyTrade } from '../../../../__fixtures__/trades';
import { getInitializedTradingState } from '../../../../__fixtures__/tradingState';
import { TradeHistoryListItem } from '../TradeHistoryListItem';

describe('TradeHistoryListItem', () => {
    const renderTradeHistoryListItem = (transaction: TradingTransaction) =>
        renderWithStoreProviderAsync(
            <TradeHistoryListItem transaction={transaction} onPress={jest.fn()} />,
            { preloadedState: { wallet: { tradingNew: getInitializedTradingState() } } },
        );

    it('should render trade correctly', async () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });

        const { getByText } = await renderTradeHistoryListItem(buyTrade);

        expect(getByText('Mercuryo')).toBeTruthy();
        expect(getByText('1234 USD')).toBeTruthy();
        expect(getByText('0.462586 ETH')).toBeTruthy();
        expect(getByText('Trans. ID: d3ef3451-8f68-4250-9e08-580ece5e7d12')).toBeTruthy();
        expect(getByText('Submitted')).toBeTruthy();
    });

    it('should render date and time', async () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });

        const { getByText } = await renderTradeHistoryListItem(buyTrade);

        expect(getByText(/0[45]\/10\/2025 at [0-9]{1,2}:21/)).toBeTruthy();
    });
});
