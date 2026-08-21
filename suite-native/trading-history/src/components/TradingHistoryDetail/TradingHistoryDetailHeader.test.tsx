import { type TradingTransaction } from '@suite-common/trading';
import { type TxKeyPath, getTranslation } from '@suite-native/intl';
import { getBuyTrade, getExchangeTrade, getSellTrade } from '@suite-native/trading-fixtures';

import {
    TradingHistoryDetailHeader,
    TradingHistoryDetailHeaderSubtitle,
} from './TradingHistoryDetailHeader';
import { renderWithTradingHistoryProvider } from '../../test-utils/tradingHistoryTestUtils';

type HeaderTestCase = {
    trade: TradingTransaction;
    titleId: TxKeyPath;
    descriptionId: TxKeyPath;
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
        },
        {
            trade: getBuyTrade({ status: 'ERROR' }),
            titleId: 'moduleTrading.tradeHistory.detail.header.buy.failed.title',
            descriptionId: 'moduleTrading.tradeHistory.detail.header.buy.failed.description',
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
        },
        {
            trade: getSellTrade({ status: 'REFUNDED' }),
            titleId: 'moduleTrading.tradeHistory.detail.header.sell.failed.title',
            descriptionId: 'moduleTrading.tradeHistory.detail.header.sell.failed.description',
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
        },
        {
            trade: getExchangeTrade({ status: 'KYC' }),
            titleId: 'moduleTrading.tradeHistory.detail.header.exchange.kyc.title',
            descriptionId: 'moduleTrading.tradeHistory.detail.header.exchange.kyc.description',
        },
        {
            trade: getExchangeTrade({ status: 'ERROR' }),
            titleId: 'moduleTrading.tradeHistory.detail.header.exchange.returned.title',
            descriptionId: 'moduleTrading.tradeHistory.detail.header.exchange.returned.description',
        },
    ];

    it.each(testCases)(
        'should render the header for $titleId',
        ({ trade, titleId, descriptionId }) => {
            const orderId = trade.data.orderId ?? 'missing-order-id';
            const { toJSON } = renderWithTradingHistoryProvider(
                <>
                    <TradingHistoryDetailHeader orderId={orderId} />
                    <TradingHistoryDetailHeaderSubtitle orderId={orderId} />
                </>,
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

            expect(toJSON()).toEqual([
                getTranslation(titleId, translationValues),
                getTranslation(descriptionId, translationValues),
            ]);
        },
    );
});
