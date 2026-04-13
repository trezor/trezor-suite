import { type TradingTransaction } from '@suite-common/trading';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';
import {
    getBuyTrade,
    getExchangeTrade,
    getInitializedTradingStateWithQuotes,
    getSellTrade,
} from '@suite-native/trading-fixtures';

import { TradeDetailHeader } from '../TradeDetailHeader';

const createPreloadedState = (trades: TradingTransaction[]) => ({
    wallet: {
        trading: {
            ...getInitializedTradingStateWithQuotes(),
            trades,
        },
    },
});

describe('TradeDetailHeader', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const renderHeader = (orderId: string, trades: TradingTransaction[] = []) =>
        renderWithStoreProvider(
            <TradeDetailHeader orderId={orderId} onOpenedBrowser={jest.fn()} />,
            { preloadedState: createPreloadedState(trades) },
        );

    describe('Trade Not Found', () => {
        it('should not render when trade is not found', () => {
            const { toJSON } = renderHeader('nonexistent_order_id');

            expect(toJSON()).toBeNull();
        });
    });

    describe('Success Status', () => {
        it('should render header with spinner for in-progress pending trade', () => {
            const sellTrade = getSellTrade({ status: 'PENDING' });
            const { getByTestId } = renderHeader(sellTrade.data.orderId!, [sellTrade]);

            expect(getByTestId('@circular-spinner')).toBeTruthy();
        });

        it('should render header without spinner for final success status', () => {
            const sellTrade = getSellTrade({ status: 'SUCCESS' });
            const { queryByTestId } = renderHeader(sellTrade.data.orderId!, [sellTrade]);

            expect(queryByTestId('@circular-spinner')).toBeNull();
        });
    });

    describe('Alert Rendering', () => {
        it('should render error alert for buy trade error status', () => {
            const buyTrade = getBuyTrade({ status: 'ERROR' });
            const { getByText } = renderHeader(buyTrade.data.orderId!, [buyTrade]);

            expect(getByText('Transaction failed')).toBeTruthy();
        });

        it('should render waiting alert for buy trade submitted status', () => {
            const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
            const { getByText } = renderHeader(buyTrade.data.orderId!, [buyTrade]);

            expect(getByText('Waiting for your payment ...')).toBeTruthy();
        });

        it('should render converting alert for exchange converting status', () => {
            const exchangeTrade = getExchangeTrade({ status: 'CONVERTING' });
            const { getByText } = renderHeader(exchangeTrade.data.orderId!, [exchangeTrade]);

            expect(getByText('Converting your crypto...')).toBeTruthy();
        });

        it('should render kyc alert for exchange kyc status', () => {
            const exchangeTrade = getExchangeTrade({ status: 'KYC' });
            const { getByText } = renderHeader(exchangeTrade.data.orderId!, [exchangeTrade]);

            expect(getByText('Identity verification required')).toBeTruthy();
        });

        it('should render sending alert for exchange sending status', () => {
            const exchangeTrade = getExchangeTrade({ status: 'SENDING' });
            const { getByText } = renderHeader(exchangeTrade.data.orderId!, [exchangeTrade]);

            expect(getByText('Sending your crypto...')).toBeTruthy();
        });
    });
});
