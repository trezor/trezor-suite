import { Pressable } from 'react-native';

import type { BuyTrade, SellFiatTrade } from 'invity-api';

import { HStack, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { useChangeStringsExtractor } from '../../../hooks/history/useChangeStringsExtractor';

export type PaymentMethodListItemProps<T extends BuyTrade | SellFiatTrade> = {
    quote: T;
    onPress: () => void;
    isFirst?: boolean;
    isLast?: boolean;
};

export const PAYMENT_METHOD_LIST_ITEM_HEIGHT = 74 as const;

const itemStyle = prepareNativeStyle<{ isFirst: boolean; isLast: boolean }>(
    (
        {
            spacings: { sp1, sp12, sp20 },
            colors: { backgroundSurfaceElevation1 },
            borders: {
                radii: { r20 },
            },
        },
        { isFirst, isLast },
    ) => ({
        paddingHorizontal: sp20,
        paddingVertical: sp12,
        backgroundColor: backgroundSurfaceElevation1,
        marginBottom: sp1,
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
    const { formattedRate } = useChangeStringsExtractor(quote);

    return (
        <Pressable onPress={onPress} style={applyStyle(itemStyle, { isFirst, isLast })}>
            <VStack spacing="sp4">
                <HStack alignItems="center" justifyContent="space-between">
                    <Text
                        variant="body-md"
                        color="textDefault"
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {quote.paymentMethodName ?? ''}
                    </Text>
                </HStack>
                {!!formattedRate && (
                    <HStack alignItems="center" justifyContent="space-between">
                        <Text
                            variant="body-sm"
                            color="textSubdued"
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            <Translation id="moduleTrading.providerListItem.rate" />
                        </Text>
                        <Text
                            variant="body-sm"
                            color="textSubdued"
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {formattedRate}
                        </Text>
                    </HStack>
                )}
            </VStack>
        </Pressable>
    );
};
