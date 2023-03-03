import React from 'react';

import { TextProps } from '@suite-native/atoms';
import { useFormatters } from '@suite-common/formatters';
import { NetworkSymbol } from '@suite-common/wallet-config';

import { FormatterProps } from '../types';
import { EmptyAmountText } from './EmptyAmountText';
import { AmountText } from './AmountText';

type CryptoToFiatAmountFormatterProps = FormatterProps<string | null> &
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
    color = 'textSubdued',
    ...textProps
}: CryptoToFiatAmountFormatterProps) => {
    const { CryptoAmountFormatter: formatter } = useFormatters();

    if (!value) return <EmptyAmountText />;

    const formattedValue = formatter.format(value, { isBalance, symbol: network });

    return (
        <AmountText
            value={formattedValue}
            isDiscreetText={isDiscreetText}
            variant={variant}
            color={color}
            {...textProps}
        />
    );
};
