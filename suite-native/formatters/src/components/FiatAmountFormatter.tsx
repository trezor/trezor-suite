import React from 'react';

import { Text, DiscreetText, TextProps } from '@suite-native/atoms';
import { useFormatters } from '@suite-common/formatters';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { isTestnet } from '@suite-common/wallet-utils';

import { FormatterProps } from '../types';

type CryptoToFiatAmountFormatterProps = FormatterProps<string | number | null> &
    TextProps & {
        network?: NetworkSymbol;
        isDiscreetText?: boolean;
    };

export const FiatAmountFormatter = ({
    network,
    value,
    isDiscreetText = true,
    ...textProps
}: CryptoToFiatAmountFormatterProps) => {
    const { FiatAmountFormatter: formatter } = useFormatters();

    const isTestnetValue = !!network && isTestnet(network);

    // The text has to contain a whitespace to keep desired line height.
    if (!value || isTestnetValue) return <Text> </Text>;

    const formattedValue = formatter.format(value);
    if (isDiscreetText) {
        return <DiscreetText {...textProps}>{formattedValue}</DiscreetText>;
    }

    return <Text {...textProps}>{formattedValue}</Text>;
};
