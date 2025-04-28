import type { BuyTrade } from 'invity-api';

import { TradingTransaction } from '@suite-common/trading';
import { fireEvent, renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { getBuyTrade, getSellTrade } from '../../../../__fixtures__/trades';
import { getInitializedTradingState } from '../../../../__fixtures__/tradingState';
import { TradeDetailFooter } from '../TradeDetailFooter';

const mockNavigation = {
    navigate: jest.fn(),
};

const mockCopyToClipboard = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => mockNavigation,
}));

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

    it('should render payment button for waiting status', async () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
        const preloadedState = getPreloadedState([buyTrade]);

        const { getByText } = await renderWithStoreProviderAsync(
            <TradeDetailFooter orderId={buyTrade.data.orderId!} onOpenedWebview={jest.fn()} />,
            { preloadedState },
        );

        expect(getByText('Proceed to pay')).toBeTruthy();
    });

    it('should not render when trade is not found', async () => {
        const preloadedState = getPreloadedState([]);

        const { toJSON } = await renderWithStoreProviderAsync(
            <TradeDetailFooter orderId="nonexistent_order_id" onOpenedWebview={jest.fn()} />,
            { preloadedState },
        );

        expect(toJSON()).toBeNull();
    });

    it('should navigate to webview when payment button is pressed', async () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
        const preloadedState = getPreloadedState([buyTrade]);

        const { getByText } = await renderWithStoreProviderAsync(
            <TradeDetailFooter orderId={buyTrade.data.orderId!} onOpenedWebview={jest.fn()} />,
            { preloadedState },
        );

        fireEvent.press(getByText('Proceed to pay'));

        expect(mockNavigation.navigate).toHaveBeenCalledWith('TradingWebView', {
            closeCallbackUrl:
                'suitetrading://buy/trade?orderId=d3ef3451-8f68-4250-9e08-580ece5e7d12',
            source: { uri: (buyTrade.data as BuyTrade).partnerData },
        });
    });

    it('should render support button and order ID for error status', async () => {
        const buyTrade = getBuyTrade({ status: 'ERROR' });
        const preloadedState = getPreloadedState([buyTrade]);

        const { getByText } = await renderWithStoreProviderAsync(
            <TradeDetailFooter orderId={buyTrade.data.orderId!} onOpenedWebview={jest.fn()} />,
            { preloadedState },
        );

        expect(getByText('Go to provider support')).toBeTruthy();
        expect(getByText(buyTrade.data.orderId!)).toBeTruthy();
        expect(getByText('Copy')).toBeTruthy();
    });

    it('should handle copy order ID press', async () => {
        const sellTrade = getSellTrade({ status: 'ERROR' });
        const preloadedState = getPreloadedState([sellTrade]);

        const { getByText } = await renderWithStoreProviderAsync(
            <TradeDetailFooter orderId={sellTrade.data.orderId!} onOpenedWebview={jest.fn()} />,
            { preloadedState },
        );

        fireEvent.press(getByText('Copy'));

        expect(mockCopyToClipboard).toHaveBeenCalledWith(
            sellTrade.data.orderId!,
            'Saved to clipboard',
        );
    });
});
