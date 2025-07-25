import React from 'react';

import { useFormatters } from '@suite-common/formatters';
import { BaseCurrencyAmount } from '@suite-common/wallet-utils';
import { Box, HStack, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { FormatterProps } from '../types';
import { AmountText } from './AmountText';
import { EmptyAmountText } from './EmptyAmountText';
import { parseBalanceAmount } from '../utils';

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
    const { BaseCurrencyAmountFormatter: formatter } = useFormatters();

    if (!value) return <EmptyAmountText />;

    const formattedValue = formatter.format(value);

    if (!formattedValue) return <EmptyAmountText />;

    const { currencySymbol, wholeNumber, decimalNumber } = parseBalanceAmount(formattedValue);

    const isCrypto =
        currencySymbol?.toLowerCase() === 'sat' || currencySymbol?.toLowerCase() === 'btc';

    const valueElement = (
        <Box flexDirection="row" alignItems="flex-end" flexShrink={1}>
            <AmountText
                value={wholeNumber}
                variant="titleLarge"
                isDiscreetText
                isForcedDiscreetMode={isForcedDiscreetMode}
                style={applyStyle(wholeNumberStyle)}
            />
            <AmountText
                value={decimalNumber}
                variant={isCrypto ? 'titleLarge' : 'titleSmall'}
                isDiscreetText
                isForcedDiscreetMode={isForcedDiscreetMode}
                style={isCrypto ? applyStyle(wholeNumberStyle) : undefined}
            />
        </Box>
    );

    const currencyElement = <Text variant="titleSmall">{currencySymbol}</Text>;

    return (
        <Box flexDirection="row" alignItems="flex-end" flexShrink={1} testID={testID}>
            {isCrypto ? (
                <HStack spacing="sp8" alignItems="center">
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
