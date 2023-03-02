import React from 'react';

import { Text, TextProps } from '@suite-native/atoms';
import { EthereumTokenSymbol } from '@suite-native/ethereum-tokens';

type EthereumTokenSymbolFormatterProps = {
    ethereumSymbol: EthereumTokenSymbol;
} & TextProps;

export const EthereumTokenSymbolFormatter = ({
    ethereumSymbol,
    ...rest
}: EthereumTokenSymbolFormatterProps) => <Text {...rest}>{ethereumSymbol.toUpperCase()}</Text>;
