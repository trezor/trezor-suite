import { type TradingTransaction } from '@suite-common/trading';
import { fireEvent, renderWithStoreProvider } from '@suite-native/test-utils';
import { getInitializedTradingState, getSellTrade } from '@suite-native/trading-fixtures';

import { TradeDetailFooter } from '../TradeDetailFooter';

const mockCopyToClipboard = jest.fn();

jest.mock('@suite-native/clipboard', () => ({
    useCopyToClipboard: () => mockCopyToClipboard,
}));

const getPreloadedState = (trades: TradingTransaction[]) => ({
    wallet: {
        trading: {
            ...getInitializedTradingState(),
            trades,
        },
    },
});

describe('TradeDetailFooter', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should not render when trade is not found', () => {
        const preloadedState = getPreloadedState([]);

        const { toJSON } = renderWithStoreProvider(
            <TradeDetailFooter orderId="nonexistent_order_id" />,
            { preloadedState },
        );

        expect(toJSON()).toBeNull();
    });

    it('should handle copy order ID press', () => {
        const sellTrade = getSellTrade({ status: 'ERROR' });
        const preloadedState = getPreloadedState([sellTrade]);

        const { getByText } = renderWithStoreProvider(
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
