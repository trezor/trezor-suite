import { Pressable } from 'react-native';
import { useSelector } from 'react-redux';

import type { CryptoId } from 'invity-api';

import { useFormatters } from '@suite-common/formatters';
import {
    TradingRootState,
    TradingTransaction,
    selectTradingCoinSymbolByCryptoId,
    selectTradingProviderByNameAndTradeType,
} from '@suite-common/trading';
import { Card, HStack, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

import { TradeStatusBadge } from './TradeStatusBadge';
import { getTradeOperationData } from '../../../utils/quotesUtils';
import { TradingProviderLogo } from '../TradingProviderLogo';

type TradeHistoryListItemProps = {
    transaction: TradingTransaction;
    onPress?: () => void;
};

export const TRADE_HISTORY_LIST_ITEM_HEIGHT = 148;

export const useSymbolExtractor = (cryptoId: CryptoId | undefined) => {
    const symbol = useSelector((state: TradingRootState) =>
        selectTradingCoinSymbolByCryptoId(state, cryptoId),
    );

    return symbol ?? cryptoId;
};

export const useChangeStringsExtractor = (transaction: TradingTransaction) => {
    const { fromValue, fromCryptoId, toValue, toCryptoId } = getTradeOperationData(transaction);
    const fromSymbol = useSymbolExtractor(fromCryptoId);
    const toSymbol = useSymbolExtractor(toCryptoId);

    return {
        fromStringValue: `${fromValue ?? ''} ${fromSymbol ?? ''}`,
        toStringValue: `${toValue ?? ''} ${toSymbol ?? ''}`,
    };
};

export const TradeHistoryListItem = ({ transaction, onPress }: TradeHistoryListItemProps) => {
    const { DateFormatter, TimeFormatter } = useFormatters();
    const providerInfo = useSelector((state: TradingRootState) =>
        selectTradingProviderByNameAndTradeType(
            state,
            transaction.data.exchange,
            transaction.tradeType,
        ),
    );
    const { fromStringValue, toStringValue } = useChangeStringsExtractor(transaction);

    const date = new Date(transaction.date);

    return (
        <Pressable onPress={onPress} style={{ paddingBottom: 16 }}>
            <Card>
                <VStack>
                    <HStack justifyContent="space-between">
                        <Text color="textSubdued">
                            <Translation
                                id="moduleTrading.tradeHistory.timeAt"
                                values={{
                                    date: <DateFormatter value={date} />,
                                    time: <TimeFormatter value={date} />,
                                }}
                            />
                        </Text>
                        <TradeStatusBadge status={transaction.data.status} />
                    </HStack>
                    <HStack>
                        {providerInfo?.logo && <TradingProviderLogo logo={providerInfo.logo} />}
                        <Text>{providerInfo?.companyName}</Text>
                    </HStack>
                    <HStack alignItems="center">
                        <Text>{fromStringValue}</Text>
                        <Icon name="caretRight" size="medium" />
                        <Text>{toStringValue}</Text>
                    </HStack>
                    <Text variant="hint" color="textSubdued">
                        <Translation
                            id="moduleTrading.tradeHistory.transactionId"
                            values={{ orderId: transaction.data.orderId }}
                        />
                    </Text>
                </VStack>
            </Card>
        </Pressable>
    );
};
