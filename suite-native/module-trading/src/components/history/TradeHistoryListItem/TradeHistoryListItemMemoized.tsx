import { memo } from 'react';
import { Pressable } from 'react-native';
import { useSelector } from 'react-redux';

import { useFormatters } from '@suite-common/formatters';
import {
    TradingRootState,
    TradingTransaction,
    selectTradingProviderByNameAndTradeType,
} from '@suite-common/trading';
import { Card, HStack, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

import { useChangeStringsExtractor } from '../../../hooks/history/useChangeStringsExtractor';
import { ProviderLogo } from '../../general/ProviderLogo';
import { TradeStatusBadge } from '../TradeStatusBadge';

export type TradeHistoryListItemMemoizedProps = {
    transaction: TradingTransaction;
    onPress?: () => void;
};

export const TRADE_HISTORY_LIST_ITEM_HEIGHT = 148;

export const TradeHistoryListItemMemoized = memo(
    ({ transaction, onPress }: TradeHistoryListItemMemoizedProps) => {
        const { DateFormatter, TimeFormatter } = useFormatters();
        const { fromStringValue, toStringValue } = useChangeStringsExtractor(transaction);

        const providerInfo = useSelector((state: TradingRootState) =>
            selectTradingProviderByNameAndTradeType(
                state,
                transaction.data.exchange,
                transaction.tradeType,
            ),
        );

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
                            {providerInfo?.logo && <ProviderLogo logo={providerInfo.logo} />}
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
    },
);
