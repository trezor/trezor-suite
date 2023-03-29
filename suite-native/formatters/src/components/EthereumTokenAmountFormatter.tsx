import React from 'react';

import { Box, Text, TextProps } from '@suite-native/atoms';
import { EthereumTokenSymbol } from '@suite-common/wallet-types';
import { localizeNumber } from '@suite-common/wallet-utils';

import { FormatterProps } from '../types';
import { EthereumTokenSymbolFormatter } from './EthereumTokenSymbolFormatter';
import { AmountText } from './AmountText';

type EthereumTokenAmountFormatterProps = {
    ethereumToken: EthereumTokenSymbol;
    isDiscreetText?: boolean;
} & FormatterProps<number | string> &
    TextProps;

export const EthereumTokenAmountFormatter = ({
    value,
    ethereumToken,
    isDiscreetText = true,
    ...rest
}: EthereumTokenAmountFormatterProps) => {
    const formattedValue = localizeNumber(value);

    return (
        <Box flexDirection="row">
            <AmountText value={formattedValue} isDiscreetText={isDiscreetText} {...rest} />
            <Text> </Text>
            <EthereumTokenSymbolFormatter ethereumSymbol={ethereumToken} {...rest} />
        </Box>
    );
};
