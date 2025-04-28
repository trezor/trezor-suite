import { TradingTransaction } from '@suite-common/trading';
import { renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { getBuyTrade, getSellTrade } from '../../../../__fixtures__/trades';
import { getInitializedTradingState } from '../../../../__fixtures__/tradingState';
import { TradeDetailHeader } from '../TradeDetailHeader';

const getPreloadedState = (trades: TradingTransaction[]) => ({
    wallet: {
        tradingNew: {
            ...getInitializedTradingState(),
            trades,
        },
    },
});

describe('TradeDetailHeader', () => {
    it('should not render when trade is not found', async () => {
        const preloadedState = getPreloadedState([]);

        const { toJSON } = await renderWithStoreProviderAsync(
            <TradeDetailHeader orderId="nonexistent_order_id" />,
            { preloadedState },
        );

        expect(toJSON()).toBeNull();
    });

    it('should render header with spinner for in-progress trade', async () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
        const preloadedState = getPreloadedState([buyTrade]);

        const { getByTestId } = await renderWithStoreProviderAsync(
            <TradeDetailHeader orderId={buyTrade.data.orderId!} />,
            { preloadedState },
        );

        expect(getByTestId('@circular-spinner')).toBeTruthy();
    });

    it('should render header without spinner for final status', async () => {
        const sellTrade = getSellTrade({ status: 'SUCCESS' });
        const preloadedState = getPreloadedState([sellTrade]);

        const { queryByTestId } = await renderWithStoreProviderAsync(
            <TradeDetailHeader orderId={sellTrade.data.orderId!} />,
            { preloadedState },
        );

        expect(queryByTestId('@circular-spinner')).toBeNull();
    });
});
