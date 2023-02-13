import React from 'react';

import { Text, DiscreetText, TextProps } from '@suite-native/atoms';
import { useFormatters } from '@suite-common/formatters';
import { NetworkSymbol } from '@suite-common/wallet-config';

import { FormatterProps } from '../types';

type CryptoToFiatAmountFormatterProps = FormatterProps<string | number | null> &
    TextProps & {
        network: NetworkSymbol;
        isBalance?: boolean;
        isDiscreetText?: boolean;
    };

export const CryptoAmountFormatter = ({
    value,
    network,
    isBalance = true,
    isDiscreetText = true,
    variant = 'hint',
    color = 'gray600',
    ...textProps
}: CryptoToFiatAmountFormatterProps) => {
    const { CryptoAmountFormatter: formatter } = useFormatters();

    // The text has to contain a whitespace to keep desired line height.
    if (!value) return <Text> </Text>;

    const formattedValue = formatter.format(value, { isBalance, symbol: network });

    if (isDiscreetText) {
        return (
            <DiscreetText variant={variant} color={color} {...textProps}>
                {formattedValue}
            </DiscreetText>
        );
    }

    return (
        <Text variant={variant} color={color} {...textProps}>
            {formattedValue}
        </Text>
    );
};
