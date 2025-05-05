import { Pressable } from 'react-native';
import { useSelector } from 'react-redux';

import { useFormatters } from '@suite-common/formatters';
import {
    TradingRootState,
    TradingTransaction,
    selectTradingProviderByNameAndTradeType,
} from '@suite-common/trading';
import {
    AccountsRootState,
    DeviceRootState,
    selectDeviceAccountByDescriptorAndNetworkSymbol,
} from '@suite-common/wallet-core';
import { Card, HStack, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

import { TradeStatusBadge } from './TradeStatusBadge';
import { useChangeStringsExtractor } from '../../../hooks/useChangeStringsExtractor';
import { useTradingWatchTrade } from '../../../hooks/useTradingWatchTrade';
import { TradingProviderLogo } from '../TradingProviderLogo';

type TradeHistoryListItemProps = {
    transaction: TradingTransaction;
    onPress?: () => void;
};

export const TRADE_HISTORY_LIST_ITEM_HEIGHT = 148;

export const TradeHistoryListItem = ({ transaction, onPress }: TradeHistoryListItemProps) => {
    const { DateFormatter, TimeFormatter } = useFormatters();
    const account = useSelector((state: AccountsRootState & DeviceRootState) =>
        selectDeviceAccountByDescriptorAndNetworkSymbol(
            state,
            transaction.account.descriptor,
            transaction.account.symbol,
        ),
    );
    useTradingWatchTrade({ account: account ?? undefined, trade: transaction });
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
