import { useSelector } from 'react-redux';

import type { CryptoId } from 'invity-api';

import {
    TradingRootState,
    cryptoIdToNetworkAndContractAddress,
    isCryptoIdForNativeToken,
    selectTradingTradeByOrderId,
} from '@suite-common/trading';
import { NetworkDisplaySymbol } from '@suite-common/wallet-config';
import { AccountsRootState } from '@suite-common/wallet-core';
import { Card, HStack, Text } from '@suite-native/atoms';
import { CryptoIcon } from '@suite-native/icons';
import { Translation, useTranslate } from '@suite-native/intl';
import { CombinedLabelingState } from '@suite-native/labeling';
import { selectAccountLabelWithNetworkFallback } from '@suite-native/trading-state';

import { TradeDetailInfoRow } from './TradeDetailInfoRow';
import { useChangeStringsExtractor } from '../../../hooks/history/useChangeStringsExtractor';

export type TradeDetailTransactionInfoProps = {
    orderId: string;
};

type CryptoIdIconProps = { cryptoId: CryptoId | undefined };

const TRADE_DETAIL_TEST_ID = '@trading/history/detail';

const CryptoIdIcon = ({ cryptoId }: CryptoIdIconProps) => {
    const { network, contractAddress } = cryptoIdToNetworkAndContractAddress(cryptoId);
    if (!network || !cryptoId) {
        return null;
    }

    return isCryptoIdForNativeToken(cryptoId) ? (
        <CryptoIcon symbol={network.displaySymbol as NetworkDisplaySymbol} size="tiny" />
    ) : (
        <CryptoIcon symbol={network.symbol} contractAddress={contractAddress} size="tiny" />
    );
};

export const TradeDetailTransactionInfo = ({ orderId }: TradeDetailTransactionInfoProps) => {
    const { translate } = useTranslate();
    const trade = useSelector((state: TradingRootState) =>
        selectTradingTradeByOrderId(state, orderId),
    );
    const tradeType = trade?.tradeType;
    const isSell = tradeType === 'sell';
    const isBuy = tradeType === 'buy';

    const { fromStringValue, toStringValue, fromCurrency, toCurrency, isFromCrypto, isToCrypto } =
        useChangeStringsExtractor(trade?.data);

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
                    <HStack alignItems="center" spacing="sp2">
                        {isFromCrypto && <CryptoIdIcon cryptoId={fromCurrency} />}
                        <Text variant="body-sm" testID={TRADE_DETAIL_TEST_ID + '/paid'}>
                            {fromStringValue}
                        </Text>
                    </HStack>
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
                    <HStack alignItems="center" spacing="sp2">
                        {isToCrypto && <CryptoIdIcon cryptoId={toCurrency} />}
                        <Text variant="body-sm">{toStringValue}</Text>
                    </HStack>
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
