import React from 'react';

import { Box, Text } from '@suite-native/atoms';
import { useFormatters } from '@suite-common/formatters';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { FormatterProps } from '../types';
import { EmptyAmountText } from './EmptyAmountText';
import { AmountText } from './AmountText';
import { parseBalanceAmount } from '../utils';

type BalanceFormatterProps = FormatterProps<string | null>;

const wholeNumberStyle = prepareNativeStyle(utils => ({
    flexShrink: 1,
    marginBottom: -utils.spacings.s,
    textAlign: 'center',
}));

export const FiatBalanceFormatter = ({ value }: BalanceFormatterProps) => {
    const { applyStyle } = useNativeStyles();
    const { FiatAmountFormatter: formatter } = useFormatters();

    if (!value) return <EmptyAmountText />;

    const formattedValue = formatter.format(value);

    if (!formattedValue) return <EmptyAmountText />;

    const { currencySymbol, wholeNumber, decimalNumber } = parseBalanceAmount(formattedValue);

    return (
        <Box flexDirection="row" alignItems="flex-end" flexShrink={1}>
            <Text variant="titleSmall">{currencySymbol}</Text>
            <AmountText
                value={wholeNumber}
                variant="titleLarge"
                isDiscreetText
                style={applyStyle(wholeNumberStyle)}
            />
            <AmountText value={decimalNumber} variant="titleSmall" isDiscreetText />
        </Box>
    );
};
