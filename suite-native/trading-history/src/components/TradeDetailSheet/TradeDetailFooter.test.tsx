import { type TradingTransaction } from '@suite-common/trading';
import { getTranslation } from '@suite-native/intl';
import { fireEvent, renderWithStoreProvider } from '@suite-native/test-utils-store';
import { getInitializedTradingState, getSellTrade } from '@suite-native/trading-fixtures';

import { TradeDetailFooter } from './TradeDetailFooter';

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
        jest.clearAllMocks();
    });

    it('should not render when trade is not found', async () => {
        const preloadedState = getPreloadedState([]);

        const { toJSON } = await renderWithStoreProvider(
            <TradeDetailFooter orderId="nonexistent_order_id" />,
            { preloadedState },
        );

        expect(toJSON()).toBeNull();
    });

    it('should handle copy order ID press', async () => {
        const sellTrade = getSellTrade({ status: 'ERROR' });
        const preloadedState = getPreloadedState([sellTrade]);

        const { getByText } = await renderWithStoreProvider(
            <TradeDetailFooter orderId={sellTrade.data.orderId!} />,
            { preloadedState },
        );

        await fireEvent.press(getByText(getTranslation('generic.buttons.copy')));

        expect(mockCopyToClipboard).toHaveBeenCalledWith(
            sellTrade.data.orderId!,
            getTranslation('generic.savedToClipboard'),
        );
    });
});
