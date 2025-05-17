import { TradingTransaction } from '@suite-common/trading';
import { renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { getBuyTrade, getExchangeTrade } from '../../../../__fixtures__/trades';
import { getInitializedTradingState } from '../../../../__fixtures__/tradingState';
import { TradeDetailInfo } from '../TradeDetailInfo';

const getPreloadedState = (trades: TradingTransaction[]) => ({
    wallet: {
        tradingNew: {
            ...getInitializedTradingState(),
            trades,
        },
    },
});

describe('TradeDetailInfo', () => {
    it('should not render when trade is not found', async () => {
        const preloadedState = getPreloadedState([]);

        const { toJSON } = await renderWithStoreProviderAsync(
            <TradeDetailInfo orderId="nonexistent_order_id" />,
            { preloadedState },
        );

        expect(toJSON()).toBeNull();
    });

    it('should render buy trade info correctly', async () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });

        const preloadedState = getPreloadedState([buyTrade]);

        const { getByText } = await renderWithStoreProviderAsync(
            <TradeDetailInfo orderId={buyTrade.data.orderId!} />,
            { preloadedState },
        );

        expect(getByText('Mercuryo')).toBeTruthy();
        expect(getByText('Credit Card')).toBeTruthy();

        expect(getByText(/0[45]\/10\/2025/)).toBeTruthy();
        expect(getByText(/[0-9]{1,2}:21/)).toBeTruthy();
    });

    it('should render exchange trade info correctly', async () => {
        const exchangeTrade = getExchangeTrade({ status: 'CONVERTING' });

        const preloadedState = getPreloadedState([exchangeTrade]);

        const { getByText, queryByText } = await renderWithStoreProviderAsync(
            <TradeDetailInfo orderId={exchangeTrade.data.orderId!} />,
            { preloadedState },
        );

        expect(getByText(/0[23]\/12\/2025/)).toBeTruthy();
        expect(getByText(/[0-9]{1,2}:11/)).toBeTruthy();
        expect(queryByText('Mercuryo')).toBeNull();
    });
});
