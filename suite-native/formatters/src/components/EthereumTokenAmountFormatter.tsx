import React from 'react';

import { TextProps } from '@suite-native/atoms';
import { EthereumTokenSymbol } from '@suite-native/ethereum-tokens';
import { localizeNumber } from '@suite-common/wallet-utils';

import { FormatterProps } from '../types';
import { AmountText } from './AmountText';
import { convertTokenValueToDecimal } from '../utils';

type EthereumTokenAmountFormatterProps = {
    ethereumToken: EthereumTokenSymbol;
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
