import { useSelector } from 'react-redux';

import type { CryptoId } from 'invity-api';

import { type TradingRootState, selectTradingTradeByOrderId } from '@suite-common/trading';
import { type AccountsRootState } from '@suite-common/wallet-core';
import { Card } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { CombinedLabelingState } from '@suite-native/labeling';
import { selectAccountLabelWithNetworkFallback } from '@suite-native/trading-state';

import { TradeDetailAmountStack } from './TradeDetailAmountStack';
import { TradeDetailInfoRow } from './TradeDetailInfoRow';
import { useChangeStringsExtractor } from '../../../hooks/history/useChangeStringsExtractor';

export type TradeDetailTransactionInfoProps = {
    orderId: string;
};

const TRADE_DETAIL_TEST_ID = '@trading/history/detail';

export const TradeDetailTransactionInfo = ({ orderId }: TradeDetailTransactionInfoProps) => {
    const { translate } = useTranslate();
    const trade = useSelector((state: TradingRootState) =>
        selectTradingTradeByOrderId(state, orderId),
    );
    const tradeType = trade?.tradeType;
    const isSell = tradeType === 'sell';
    const isBuy = tradeType === 'buy';

    const {
        fromStringValue,
        toStringValue,
        fromCurrency,
        toCurrency,
        isFromCrypto,
        isToCrypto,
        fromValue,
        toValue,
    } = useChangeStringsExtractor(trade?.data);

    const fromAccountLabel = useSelector((state: AccountsRootState & CombinedLabelingState) => {
        if (isBuy) {
            return undefined;
        }

        return selectAccountLabelWithNetworkFallback(
            state,
            trade?.sendAccountKey,
            fromCurrency as CryptoId | undefined,
        );
    });

    const toAccountLabel = useSelector((state: AccountsRootState & CombinedLabelingState) => {
        if (isSell) {
            return undefined;
        }

        return selectAccountLabelWithNetworkFallback(
            state,
            trade?.receiveAccountKey,
            toCurrency as CryptoId | undefined,
        );
    });

    if (!trade) {
        return null;
    }

    return (
        <Card noPadding>
            <TradeDetailInfoRow
                title={<Translation id="moduleTrading.tradeHistory.detail.paid" />}
                content={
                    <TradeDetailAmountStack
                        isCrypto={isFromCrypto}
                        amountValue={fromValue}
                        amountString={fromStringValue}
                        currency={fromCurrency}
                        testID={TRADE_DETAIL_TEST_ID + '/paid'}
                    />
                }
            />
            {!isBuy && (
                <TradeDetailInfoRow
                    title={<Translation id="moduleTrading.tradeHistory.detail.fromAccount" />}
                    content={fromAccountLabel ?? translate('generic.unknown')}
                />
            )}
            <TradeDetailInfoRow
                title={<Translation id="moduleTrading.tradeHistory.detail.received" />}
                content={
                    <TradeDetailAmountStack
                        isCrypto={isToCrypto}
                        amountValue={toValue}
                        amountString={toStringValue}
                        currency={toCurrency}
                        testID={TRADE_DETAIL_TEST_ID + '/received'}
                    />
                }
            />
            {!isSell && (
                <TradeDetailInfoRow
                    title={<Translation id="moduleTrading.tradeHistory.detail.toAccount" />}
                    content={toAccountLabel ?? translate('generic.unknown')}
                    contentTestID={TRADE_DETAIL_TEST_ID + '/receive-account'}
                />
            )}
        </Card>
    );
};
