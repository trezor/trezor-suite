import { type TradingTransaction } from '@suite-common/trading';
import { getTranslation } from '@suite-native/intl';
import { getBuyTrade, getExchangeTrade, getSellTrade } from '@suite-native/trading-fixtures';

import { TradingHistoryDetail } from './TradingHistoryDetail';
import { renderWithTradingHistoryProvider } from '../../test-utils/tradingHistoryTestUtils';

describe('TradingHistoryDetail', () => {
    const renderDetail = (trade: TradingTransaction) =>
        renderWithTradingHistoryProvider(
            <TradingHistoryDetail orderId={trade.data.orderId ?? 'missing-order-id'} />,
            {
                overrides: {
                    wallet: {
                        trading: {
                            trades: [trade],
                        },
                    },
                },
            },
        );

    it('should render customer and provider progress for a submitted buy', async () => {
        const trade = getBuyTrade({ status: 'SUBMITTED' });
        const { getByTestId, getByText } = await renderDetail(trade);

        expect(getByTestId('@trade-status-stepper/customer-action/active')).toBeOnTheScreen();
        expect(getByTestId('@trade-status-stepper/provider-processing/pending')).toBeOnTheScreen();
        expect(
            getByText(
                getTranslation(
                    'moduleTrading.tradeHistory.detail.statusStepper.customer.buy.processingTitle',
                ),
            ),
        ).toBeOnTheScreen();
        expect(
            getByText(
                getTranslation(
                    'moduleTrading.tradeHistory.detail.statusStepper.customer.buy.processingDescription',
                ),
            ),
        ).toBeOnTheScreen();
    });

    it('should render a payment interruption banner for a buy without a status link while waiting for payment', async () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
        const trade = {
            ...buyTrade,
            data: { ...buyTrade.data, partnerData: undefined, statusUrl: null },
        };
        const { getByText } = await renderDetail(trade);

        expect(
            getByText(
                getTranslation('moduleTrading.tradeHistory.detail.paymentInterruptionBanner.title'),
            ),
        ).toBeOnTheScreen();
        expect(
            getByText(
                getTranslation(
                    'moduleTrading.tradeHistory.detail.paymentInterruptionBanner.description',
                ),
            ),
        ).toBeOnTheScreen();
    });

    it.each([
        ['a status link is available', getBuyTrade({ status: 'SUBMITTED' })],
        [
            'the waiting-for-payment step is completed',
            {
                ...getBuyTrade({ status: 'APPROVAL_PENDING' }),
                data: {
                    ...getBuyTrade({ status: 'APPROVAL_PENDING' }).data,
                    partnerData: undefined,
                    statusUrl: null,
                },
            },
        ],
    ] as const)('should not render a payment interruption banner when %s', async (_, trade) => {
        const { queryByText } = await renderDetail(trade);

        expect(
            queryByText(
                getTranslation('moduleTrading.tradeHistory.detail.paymentInterruptionBanner.title'),
            ),
        ).not.toBeOnTheScreen();
    });

    it('should render a completed transaction and active provider step for a pending sell', async () => {
        const transactionId = 'sell-transaction-id';
        const statusUrl = 'https://example.com/sell-status';
        const sellTrade = getSellTrade({ status: 'PENDING' });
        const trade = {
            ...sellTrade,
            data: { ...sellTrade.data, txid: transactionId, statusUrl },
        };

        const { getByTestId, getByText, queryByTestId } = await renderDetail(trade);

        expect(getByTestId('@trade-status-stepper/customer-action/completed')).toBeOnTheScreen();
        expect(getByTestId('@trade-status-stepper/provider-processing/active')).toBeOnTheScreen();
        expect(getByText(transactionId)).toBeOnTheScreen();
        expect(
            getByText(
                getTranslation(
                    'moduleTrading.tradeHistory.detail.statusStepper.provider.sell.processingTitle',
                    { providerName: 'Mercuryo' },
                ),
            ),
        ).toBeOnTheScreen();
        expect(
            getByText(
                getTranslation(
                    'moduleTrading.tradeHistory.detail.statusStepper.provider.checkStatus',
                    { providerName: 'Mercuryo' },
                ),
            ),
        ).toBeOnTheScreen();
        expect(queryByTestId('@trade-status-stepper/terminal-content')).not.toBeOnTheScreen();
    });

    it('should render completed customer and provider steps for a successful swap', async () => {
        const { getByTestId, getByText, queryByText } = await renderDetail(
            getExchangeTrade({ status: 'SUCCESS' }),
        );

        expect(getByTestId('@trade-status-stepper/customer-action/completed')).toBeOnTheScreen();
        expect(
            getByTestId('@trade-status-stepper/provider-processing/completed'),
        ).toBeOnTheScreen();
        expect(
            getByText(
                getTranslation(
                    'moduleTrading.tradeHistory.detail.statusStepper.provider.exchange.completedTitle',
                    { providerName: 'Mercuryo' },
                ),
            ),
        ).toBeOnTheScreen();
        expect(
            queryByText(
                getTranslation(
                    'moduleTrading.tradeHistory.detail.statusStepper.provider.checkStatus',
                    { providerName: 'Mercuryo' },
                ),
            ),
        ).not.toBeOnTheScreen();
    });

    it('should render available transaction data instead of steps for a terminal sell', async () => {
        const transactionId = 'sell-terminal-transaction-id';
        const sellTrade = getSellTrade({ status: 'ERROR' });
        const trade = {
            ...sellTrade,
            data: {
                ...sellTrade.data,
                txid: transactionId,
                statusUrl: 'https://example.com/sell-terminal-status',
            },
        };

        const { getByTestId, getByText, queryByTestId } = await renderDetail(trade);

        expect(getByTestId('@trade-status-stepper/terminal-content')).toBeOnTheScreen();
        expect(getByText(transactionId)).toBeOnTheScreen();
        expect(
            getByText(
                getTranslation(
                    'moduleTrading.tradeHistory.detail.statusStepper.provider.checkStatus',
                    { providerName: 'Mercuryo' },
                ),
            ),
        ).toBeOnTheScreen();
        expect(queryByTestId('@trade-status-stepper/provider-processing/pending')).toBeNull();
    });
});
