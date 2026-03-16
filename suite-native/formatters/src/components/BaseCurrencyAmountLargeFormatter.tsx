import React from 'react';

import { type BaseCurrencyAmount } from '@suite-common/wallet-types';
import { Box, HStack, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { type FormatterProps } from '../types';
import { AmountText } from './AmountText';
import { EmptyAmountText } from './EmptyAmountText';
import { useFormattedGraphHeaderValues } from '../hooks/useFormattedGraphHeaderValues';

type BalanceFormatterProps = FormatterProps<BaseCurrencyAmount | null> & {
    isForcedDiscreetMode?: boolean;
    testID?: string;
};

const wholeNumberStyle = prepareNativeStyle(utils => ({
    flexShrink: 1,
    marginBottom: -utils.spacings.sp8,
    textAlign: 'center',
}));

export const BaseCurrencyAmountLargeFormatter = ({
    value,
    isForcedDiscreetMode,
    testID,
}: BalanceFormatterProps) => {
    const { applyStyle } = useNativeStyles();

    const { currencySymbol, wholeNumber, decimalNumber } = useFormattedGraphHeaderValues(
        value?.toString(),
    );

    if (!value) return <EmptyAmountText />;

    const isCrypto =
        currencySymbol?.toLowerCase() === 'sat' || currencySymbol?.toLowerCase() === 'btc';

    const valueElement = (
        <Box flexDirection="row" alignItems="flex-end" flexShrink={1}>
            <AmountText
                value={wholeNumber}
                variant="headline-lg"
                isDiscreetText
                isForcedDiscreetMode={isForcedDiscreetMode}
                style={applyStyle(wholeNumberStyle)}
            />
            <AmountText
                value={decimalNumber}
                variant={isCrypto ? 'headline-lg' : 'headline-sm'}
                isDiscreetText
                isForcedDiscreetMode={isForcedDiscreetMode}
                style={isCrypto ? applyStyle(wholeNumberStyle) : undefined}
            />
        </Box>
    );

    const currencyElement = <Text variant="headline-sm">{currencySymbol}</Text>;

    return (
        <Box flexDirection="row" alignItems="flex-end" flexShrink={1} testID={testID}>
            {isCrypto ? (
                <HStack spacing="sp8" alignItems="flex-end">
                    {valueElement}
                    {currencyElement}
                </HStack>
            ) : (
                <>
                    {currencyElement}
                    {valueElement}
                </>
            )}
        </Box>
    );
};
