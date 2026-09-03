import { memo } from 'react';

import type { CryptoId, FiatCurrencyCode } from 'invity-api';

import { useFormatters } from '@suite-common/formatters';
import { type TradingTransaction, useChangeStringsExtractor } from '@suite-common/trading';
import { Card, HStack, PressableOpacity, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { FiatCurrencyIcon, IconByCryptoId } from '@suite-native/trading-atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { TradeStatusIcon } from './TradeStatusIcon';

export type TradeHistoryListItemProps = {
    transaction: TradingTransaction;
    onPress?: () => void;
};

const pressableStyle = prepareNativeStyle(() => ({
    paddingBottom: 12,
}));

const amountTextStyle = prepareNativeStyle(() => ({
    flexShrink: 1,
}));

type TradeAmountProps = {
    formattedValue: string | undefined;
    currency: CryptoId | string | undefined;
    isCrypto: boolean | undefined;
};

const TradeAmount = ({ formattedValue, currency, isCrypto }: TradeAmountProps) => {
    const { applyStyle } = useNativeStyles();

    if (!formattedValue || !currency || isCrypto === undefined) {
        return null;
    }

    return (
        <HStack alignItems="center" spacing="sp8" flexShrink={1}>
            {isCrypto ? (
                <IconByCryptoId cryptoId={currency as CryptoId} size="small" withNetwork />
            ) : (
                <FiatCurrencyIcon size="small" value={currency as FiatCurrencyCode} />
            )}
            <Text style={applyStyle(amountTextStyle)}>{formattedValue}</Text>
        </HStack>
    );
};

export const TradeHistoryListItem = memo(({ transaction, onPress }: TradeHistoryListItemProps) => {
    const { DateTimeFormatter } = useFormatters();
    const { applyStyle } = useNativeStyles();
    const { fromStringValue, toStringValue, fromCurrency, toCurrency, isFromCrypto, isToCrypto } =
        useChangeStringsExtractor(transaction.data);

    const date = new Date(transaction.date);
    const hasFromAmount = !!fromStringValue && !!fromCurrency;
    const hasToAmount = !!toStringValue && !!toCurrency;

    return (
        <PressableOpacity
            accessibilityRole="button"
            onPress={onPress}
            style={applyStyle(pressableStyle)}
        >
            <Card>
                <VStack spacing="sp8">
                    <HStack alignItems="center" flexWrap="wrap" spacing="sp8">
                        <TradeAmount
                            formattedValue={fromStringValue}
                            currency={fromCurrency}
                            isCrypto={isFromCrypto}
                        />
                        {hasFromAmount && hasToAmount && (
                            <Icon name="arrowRight" size="mediumLarge" color="contentSecondary" />
                        )}
                        <TradeAmount
                            formattedValue={toStringValue}
                            currency={toCurrency}
                            isCrypto={isToCrypto}
                        />
                    </HStack>
                    <HStack alignItems="center" spacing="sp8">
                        <Text variant="body-sm" color="contentSecondary">
                            <DateTimeFormatter value={date} />
                        </Text>
                        <TradeStatusIcon status={transaction.data.status} />
                    </HStack>
                </VStack>
            </Card>
        </PressableOpacity>
    );
});
