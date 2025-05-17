import { TradingTransaction } from '@suite-common/trading';
import { fireEvent, renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { getSellTrade } from '../../../../__fixtures__/trades';
import { getInitializedTradingState } from '../../../../__fixtures__/tradingState';
import { TradeDetailFooter } from '../TradeDetailFooter';

const mockCopyToClipboard = jest.fn();

jest.mock('@suite-native/helpers', () => ({
    useCopyToClipboard: () => mockCopyToClipboard,
}));

const getPreloadedState = (trades: TradingTransaction[]) => ({
    wallet: {
        tradingNew: {
            ...getInitializedTradingState(),
            trades,
        },
    },
});

describe('TradeDetailFooter', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should not render when trade is not found', async () => {
        const preloadedState = getPreloadedState([]);

        const { toJSON } = await renderWithStoreProviderAsync(
            <TradeDetailFooter orderId="nonexistent_order_id" />,
            { preloadedState },
        );

        expect(toJSON()).toBeNull();
    });

    it('should handle copy order ID press', async () => {
        const sellTrade = getSellTrade({ status: 'ERROR' });
        const preloadedState = getPreloadedState([sellTrade]);

        const { getByText } = await renderWithStoreProviderAsync(
            <TradeDetailFooter orderId={sellTrade.data.orderId!} />,
            { preloadedState },
        );

        fireEvent.press(getByText('Copy'));

        expect(mockCopyToClipboard).toHaveBeenCalledWith(
            sellTrade.data.orderId!,
            'Saved to clipboard',
        );
    });
});
