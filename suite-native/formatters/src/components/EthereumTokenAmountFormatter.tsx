import React from 'react';

import { Box, Text, TextProps } from '@suite-native/atoms';
import { EthereumTokenSymbol } from '@suite-native/ethereum-tokens';
import { localizeNumber } from '@suite-common/wallet-utils';

import { FormatterProps } from '../types';
import { EthereumTokenSymbolFormatter } from './EthereumTokenSymbolFormatter';
import { AmountText } from './AmountText';

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
    const formattedValue = localizeNumber(Number(value) / 10 ** decimals);

    return (
        <Box flexDirection="row">
            <AmountText
                value={formattedValue}
                isDiscreetText={isDiscreetText}
                {...rest}
                variant={variant}
                color={color}
            />
            <Text> </Text>
            <EthereumTokenSymbolFormatter
                ethereumSymbol={ethereumToken}
                {...rest}
                variant={variant}
                color={color}
            />
        </Box>
    );
};
