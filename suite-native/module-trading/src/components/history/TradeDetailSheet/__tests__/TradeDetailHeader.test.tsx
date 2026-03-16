import { type TradingTransaction } from '@suite-common/trading';
import { renderWithStoreProviderAsync } from '@suite-native/test-utils';
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
        renderWithStoreProviderAsync(
            <TradeDetailHeader orderId={orderId} onOpenedBrowser={jest.fn()} />,
            { preloadedState: createPreloadedState(trades) },
        );

    describe('Trade Not Found', () => {
        it('should not render when trade is not found', async () => {
            const { toJSON } = await renderHeader('nonexistent_order_id');

            expect(toJSON()).toBeNull();
        });
    });

    describe('Success Status', () => {
        it('should render header with spinner for in-progress pending trade', async () => {
            const sellTrade = getSellTrade({ status: 'PENDING' });
            const { getByTestId } = await renderHeader(sellTrade.data.orderId!, [sellTrade]);

            expect(getByTestId('@circular-spinner')).toBeTruthy();
        });

        it('should render header without spinner for final success status', async () => {
            const sellTrade = getSellTrade({ status: 'SUCCESS' });
            const { queryByTestId } = await renderHeader(sellTrade.data.orderId!, [sellTrade]);

            expect(queryByTestId('@circular-spinner')).toBeNull();
        });
    });

    describe('Alert Rendering', () => {
        it('should render error alert for buy trade error status', async () => {
            const buyTrade = getBuyTrade({ status: 'ERROR' });
            const { getByText } = await renderHeader(buyTrade.data.orderId!, [buyTrade]);

            expect(getByText('Transaction failed')).toBeTruthy();
        });

        it('should render waiting alert for buy trade submitted status', async () => {
            const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
            const { getByText } = await renderHeader(buyTrade.data.orderId!, [buyTrade]);

            expect(getByText('Waiting for your payment ...')).toBeTruthy();
        });

        it('should render converting alert for exchange converting status', async () => {
            const exchangeTrade = getExchangeTrade({ status: 'CONVERTING' });
            const { getByText } = await renderHeader(exchangeTrade.data.orderId!, [exchangeTrade]);

            expect(getByText('Converting your crypto...')).toBeTruthy();
        });

        it('should render kyc alert for exchange kyc status', async () => {
            const exchangeTrade = getExchangeTrade({ status: 'KYC' });
            const { getByText } = await renderHeader(exchangeTrade.data.orderId!, [exchangeTrade]);

            expect(getByText('Identity verification required')).toBeTruthy();
        });

        it('should render sending alert for exchange sending status', async () => {
            const exchangeTrade = getExchangeTrade({ status: 'SENDING' });
            const { getByText } = await renderHeader(exchangeTrade.data.orderId!, [exchangeTrade]);

            expect(getByText('Sending your crypto...')).toBeTruthy();
        });
    });
});
