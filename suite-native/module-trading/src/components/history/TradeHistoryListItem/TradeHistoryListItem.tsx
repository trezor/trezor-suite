import { memo } from 'react';
import { Pressable } from 'react-native';
import { useSelector } from 'react-redux';

import { useFormatters } from '@suite-common/formatters';
import {
    type TradingRootState,
    type TradingTransaction,
    selectTradingProviderByNameAndTradeType,
} from '@suite-common/trading';
import { Card, HStack, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { ProviderLogo } from '@suite-native/trading-atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { useChangeStringsExtractor } from '../../../hooks/history/useChangeStringsExtractor';
import { TradeStatusBadge } from '../TradeStatusBadge';

export type TradeHistoryListItemProps = {
    transaction: TradingTransaction;
    onPress?: () => void;
};

const pressableStyle = prepareNativeStyle(() => ({
    paddingBottom: 16,
}));

export const TradeHistoryListItem = memo(({ transaction, onPress }: TradeHistoryListItemProps) => {
    const { DateFormatter, TimeFormatter } = useFormatters();
    const { applyStyle } = useNativeStyles();
    const { fromStringValue, toStringValue } = useChangeStringsExtractor(transaction.data);

    const providerInfo = useSelector((state: TradingRootState) =>
        selectTradingProviderByNameAndTradeType(
            state,
            transaction.data.exchange,
            transaction.tradeType,
        ),
    );

    const date = new Date(transaction.date);

    return (
        <Pressable onPress={onPress} style={applyStyle(pressableStyle)}>
            <Card>
                <VStack>
                    <HStack justifyContent="space-between">
                        <Text color="textSubdued">
                            <Translation
                                id="moduleTrading.tradeHistory.timeAt"
                                values={{
                                    date: <DateFormatter value={date} key="date" />,
                                    time: <TimeFormatter value={date} key="time" />,
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
                    <Text variant="body-sm" color="textSubdued">
                        <Translation
                            id="moduleTrading.tradeHistory.transactionId"
                            values={{ orderId: transaction.data.orderId }}
                        />
                    </Text>
                </VStack>
            </Card>
        </Pressable>
    );
});
