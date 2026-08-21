import { type TradingTransaction } from '@suite-common/trading';
import { type TxKeyPath, getTranslation } from '@suite-native/intl';
import { getBuyTrade, getExchangeTrade, getSellTrade } from '@suite-native/trading-fixtures';

import {
    TradingHistoryDetailCompactHeader,
    TradingHistoryDetailHeader,
} from './TradingHistoryDetailHeader';
import { renderWithTradingHistoryProvider } from '../../test-utils/tradingHistoryTestUtils';

type HeaderTestCase = {
    trade: TradingTransaction;
    titleId: TxKeyPath;
    descriptionId: TxKeyPath;
    artwork?: 'fail' | 'kyc' | 'success';
};

describe('TradingHistoryDetailHeader', () => {
    const testCases: HeaderTestCase[] = [
        {
            trade: getBuyTrade({ status: 'SUBMITTED' }),
            titleId: 'moduleTrading.tradeHistory.detail.header.buy.processing.title',
            descriptionId: 'moduleTrading.tradeHistory.detail.header.buy.processing.description',
        },
        {
            trade: getBuyTrade({ status: 'SUCCESS' }),
            titleId: 'moduleTrading.tradeHistory.detail.header.buy.completed.title',
            descriptionId: 'moduleTrading.tradeHistory.detail.header.buy.completed.description',
            artwork: 'success',
        },
        {
            trade: getBuyTrade({ status: 'ERROR' }),
            titleId: 'moduleTrading.tradeHistory.detail.header.buy.failed.title',
            descriptionId: 'moduleTrading.tradeHistory.detail.header.buy.failed.description',
            artwork: 'fail',
        },
        {
            trade: getSellTrade({ status: 'SUBMITTED' }),
            titleId: 'moduleTrading.tradeHistory.detail.header.sell.processing.title',
            descriptionId: 'moduleTrading.tradeHistory.detail.header.sell.processing.description',
        },
        {
            trade: getSellTrade({ status: 'SUCCESS' }),
            titleId: 'moduleTrading.tradeHistory.detail.header.sell.completed.title',
            descriptionId: 'moduleTrading.tradeHistory.detail.header.sell.completed.description',
            artwork: 'success',
        },
        {
            trade: getSellTrade({ status: 'REFUNDED' }),
            titleId: 'moduleTrading.tradeHistory.detail.header.sell.failed.title',
            descriptionId: 'moduleTrading.tradeHistory.detail.header.sell.failed.description',
            artwork: 'fail',
        },
        {
            trade: getExchangeTrade({ status: 'CONFIRMING' }),
            titleId: 'moduleTrading.tradeHistory.detail.header.exchange.processing.title',
            descriptionId:
                'moduleTrading.tradeHistory.detail.header.exchange.processing.description',
        },
        {
            trade: getExchangeTrade({ status: 'SUCCESS' }),
            titleId: 'moduleTrading.tradeHistory.detail.header.exchange.completed.title',
            descriptionId:
                'moduleTrading.tradeHistory.detail.header.exchange.completed.description',
            artwork: 'success',
        },
        {
            trade: getExchangeTrade({ status: 'KYC' }),
            titleId: 'moduleTrading.tradeHistory.detail.header.exchange.kyc.title',
            descriptionId: 'moduleTrading.tradeHistory.detail.header.exchange.kyc.description',
            artwork: 'kyc',
        },
        {
            trade: getExchangeTrade({ status: 'ERROR' }),
            titleId: 'moduleTrading.tradeHistory.detail.header.exchange.returned.title',
            descriptionId: 'moduleTrading.tradeHistory.detail.header.exchange.returned.description',
        },
    ];

    it.each(testCases)(
        'should render the header for $titleId',
        ({ trade, titleId, descriptionId, artwork }) => {
            const orderId = trade.data.orderId ?? 'missing-order-id';
            const { getByText, getByTestId, queryByTestId } = renderWithTradingHistoryProvider(
                <TradingHistoryDetailHeader orderId={orderId} />,
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
            const translationValues = { providerName: 'Mercuryo' };

            expect(getByText(getTranslation(titleId, translationValues))).toBeOnTheScreen();
            expect(getByText(getTranslation(descriptionId, translationValues))).toBeOnTheScreen();

            if (artwork) {
                expect(
                    getByTestId(`@trading-history/detail/header/artwork/${artwork}`),
                ).toBeOnTheScreen();
            } else {
                expect(
                    queryByTestId('@trading-history/detail/header/artwork/success'),
                ).not.toBeOnTheScreen();
                expect(
                    queryByTestId('@trading-history/detail/header/artwork/fail'),
                ).not.toBeOnTheScreen();
                expect(
                    queryByTestId('@trading-history/detail/header/artwork/kyc'),
                ).not.toBeOnTheScreen();
            }
        },
    );

    it.each([
        {
            artwork: 'success',
            titleId: 'moduleTrading.tradeHistory.detail.header.buy.completed.title' as const,
            trade: getBuyTrade({ status: 'SUCCESS' }),
        },
        {
            artwork: 'fail',
            titleId: 'moduleTrading.tradeHistory.detail.header.sell.failed.title' as const,
            trade: getSellTrade({ status: 'ERROR' }),
        },
        {
            artwork: 'kyc',
            titleId: 'moduleTrading.tradeHistory.detail.header.exchange.kyc.title' as const,
            trade: getExchangeTrade({ status: 'KYC' }),
        },
    ])('renders $artwork artwork in compact content', ({ artwork, titleId, trade }) => {
        const orderId = trade.data.orderId ?? 'missing-order-id';
        const { getByText, getByTestId } = renderWithTradingHistoryProvider(
            <TradingHistoryDetailCompactHeader orderId={orderId} />,
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

        expect(getByText(getTranslation(titleId))).toBeOnTheScreen();
        expect(getByTestId(`@trading-history/detail/header/artwork/${artwork}`)).toBeOnTheScreen();
    });
});
