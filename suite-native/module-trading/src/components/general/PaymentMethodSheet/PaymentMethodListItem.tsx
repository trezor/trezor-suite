import { Pressable } from 'react-native';

import type { BuyTrade, SellFiatTrade } from 'invity-api';

import { useTradingRequestedSide } from '@suite-common/trading';
import { HStack, Text, VStack } from '@suite-native/atoms';
import { PaymentMethodDisplay } from '@suite-native/trading-atoms';
import { useChangeStringsExtractor } from '@suite-native/trading-quote-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { RequestedAmountShortfallNote } from '../RequestedAmountShortfallNote';

export type PaymentMethodListItemProps<T extends BuyTrade | SellFiatTrade> = {
    quote: T;
    onPress: () => void;
    isFirst?: boolean;
    isLast?: boolean;
};

export const PAYMENT_METHOD_LIST_ITEM_HEIGHT = 80 as const;

const itemStyle = prepareNativeStyle<{ isFirst: boolean; isLast: boolean }>(
    (
        {
            spacings: { sp1, sp12, sp20, sp64 },
            colors: { surfaceFillRaised },
            borders: {
                radii: { r20 },
            },
        },
        { isFirst, isLast },
    ) => ({
        paddingHorizontal: sp20,
        paddingVertical: sp12,
        backgroundColor: surfaceFillRaised,
        marginBottom: sp1,
        minHeight: sp64,
        justifyContent: 'center',
        extend: [
            {
                condition: isFirst,
                style: {
                    borderTopLeftRadius: r20,
                    borderTopRightRadius: r20,
                },
            },
            {
                condition: isLast,
                style: {
                    borderBottomLeftRadius: r20,
                    borderBottomRightRadius: r20,
                },
            },
        ],
    }),
);

export const PaymentMethodListItem = <T extends BuyTrade | SellFiatTrade>({
    onPress,
    quote,
    isFirst = false,
    isLast = false,
}: PaymentMethodListItemProps<T>) => {
    const { applyStyle } = useNativeStyles();
    const requestedSide = useTradingRequestedSide(quote);
    const { fromStringValue, toStringValue } = useChangeStringsExtractor(quote);

    const displayValue = requestedSide === 'to' ? fromStringValue : toStringValue;

    return (
        <Pressable onPress={onPress} style={applyStyle(itemStyle, { isFirst, isLast })}>
            <VStack spacing="sp8">
                <HStack alignItems="center" justifyContent="space-between">
                    <PaymentMethodDisplay
                        flex={1}
                        justifyContent="flex-start"
                        paymentMethod={quote.paymentMethod}
                        paymentMethodName={quote.paymentMethodName}
                        spacing="sp12"
                    />
                    {!!displayValue && (
                        <Text variant="body-sm-strong" numberOfLines={1} ellipsizeMode="tail">
                            {displayValue}
                        </Text>
                    )}
                </HStack>

                <RequestedAmountShortfallNote quote={quote} />
            </VStack>
        </Pressable>
    );
};
