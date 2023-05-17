import React from 'react';

import { TextProps } from '@suite-native/atoms';
import { TokenSymbol } from '@suite-common/wallet-types';
import { localizeNumber } from '@suite-common/wallet-utils';

import { FormatterProps } from '../types';
import { AmountText } from './AmountText';
import { convertTokenValueToDecimal } from '../utils';
import { EmptyAmountText } from './EmptyAmountText';

type EthereumTokenAmountFormatterProps = {
    ethereumToken?: TokenSymbol;
    isDiscreetText?: boolean;
    decimals?: number;
} & FormatterProps<number | string> &
    TextProps;

export const EthereumTokenAmountFormatter = ({
    value,
    ethereumToken,
    isDiscreetText = true,
    decimals = 0,
    variant = 'hint',
    color = 'textSubdued',
    ...rest
}: EthereumTokenAmountFormatterProps) => {
    if (!ethereumToken) return <EmptyAmountText />;

    const decimalValue = convertTokenValueToDecimal(value, decimals);
    const formattedSymbol = ethereumToken.toUpperCase();
    const formattedValue = `${localizeNumber(decimalValue)} ${formattedSymbol}`;

    return (
        <AmountText
            value={formattedValue}
            isDiscreetText={isDiscreetText}
            variant={variant}
            color={color}
            {...rest}
        />
    );
};
