import React from 'react';

import { Text, DiscreetText, TextProps } from '@suite-native/atoms';
import { useFormatters } from '@suite-common/formatters';

import { FormatterProps } from '../types';

type CryptoToFiatAmountFormatterProps = FormatterProps<string | number | null> &
    TextProps & {
        isDiscreetText?: boolean;
    };

export const FiatAmountFormatter = ({
    value,
    isDiscreetText = true,
    ...textProps
}: CryptoToFiatAmountFormatterProps) => {
    const { FiatAmountFormatter: formatter } = useFormatters();

    if (!value) return <Text />;

    const formattedValue = formatter.format(value);
    if (isDiscreetText) {
        return <DiscreetText {...textProps}>{formattedValue}</DiscreetText>;
    }

    return <Text {...textProps}>{formattedValue}</Text>;
};
