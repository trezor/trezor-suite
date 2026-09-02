import { type TradingTransaction } from '@suite-common/trading';
import { getTranslation } from '@suite-native/intl';
import {
    getBuyTrade,
    getExchangeTrade,
    getInitializedTradingStateWithQuotes,
    getSellTrade,
} from '@suite-native/trading-fixtures';

import { TradeDetailHeader } from './TradeDetailHeader';
import { renderWithTradingHistoryProvider } from '../../test-utils/tradingHistoryTestUtils';

const createOverrides = (trades: TradingTransaction[]) => ({
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

    const renderHeader = async (orderId: string, trades: TradingTransaction[] = []) =>
        await renderWithTradingHistoryProvider(
            <TradeDetailHeader orderId={orderId} onOpenedBrowser={jest.fn()} />,
            { overrides: createOverrides(trades) },
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

            expect(
                getByText(getTranslation('moduleTrading.tradeHistory.detail.errorAlert.title')),
            ).toBeTruthy();
        });

        it('should render waiting alert for buy trade submitted status', async () => {
            const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
            const { getByText } = await renderHeader(buyTrade.data.orderId!, [buyTrade]);

            expect(
                getByText(getTranslation('moduleTrading.tradeHistory.detail.waitingAlert.title')),
            ).toBeTruthy();
        });

        it('should render converting alert for exchange converting status', async () => {
            const exchangeTrade = getExchangeTrade({ status: 'CONVERTING' });
            const { getByText } = await renderHeader(exchangeTrade.data.orderId!, [exchangeTrade]);

            expect(
                getByText(
                    getTranslation('moduleTrading.tradeHistory.detail.convertingAlert.title'),
                ),
            ).toBeTruthy();
        });

        it('should render kyc alert for exchange kyc status', async () => {
            const exchangeTrade = getExchangeTrade({ status: 'KYC' });
            const { getByText } = await renderHeader(exchangeTrade.data.orderId!, [exchangeTrade]);

            expect(
                getByText(getTranslation('moduleTrading.tradeHistory.detail.kycAlert.title')),
            ).toBeTruthy();
        });

        it('should render sending alert for exchange sending status', async () => {
            const exchangeTrade = getExchangeTrade({ status: 'SENDING' });
            const { getByText } = await renderHeader(exchangeTrade.data.orderId!, [exchangeTrade]);

            expect(
                getByText(getTranslation('moduleTrading.tradeHistory.detail.sendingAlert.title')),
            ).toBeTruthy();
        });
    });
});
