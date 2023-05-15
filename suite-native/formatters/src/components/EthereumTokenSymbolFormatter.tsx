import React from 'react';

import { Text, TextProps } from '@suite-native/atoms';
import { TokenSymbol } from '@suite-common/wallet-types';

type EthereumTokenSymbolFormatterProps = {
    ethereumSymbol: TokenSymbol;
} & TextProps;

export const EthereumTokenSymbolFormatter = ({
    ethereumSymbol,
    ...rest
}: EthereumTokenSymbolFormatterProps) => <Text {...rest}>{ethereumSymbol.toUpperCase()}</Text>;
