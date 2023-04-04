import React from 'react';

import { A } from '@mobily/ts-belt';

import { Box, VStack, Text } from '@suite-native/atoms';
import { EthereumTokenSymbol, filterTokenHasBalance } from '@suite-native/ethereum-tokens';
import { TokenInfo } from '@trezor/blockchain-link-types';

import { EthereumTokenInfo } from './EthereumTokenInfo';

type AccountImportEthereumTokensProps = {
    tokens: TokenInfo[];
};

export const AccountImportEthereumTokens = ({ tokens }: AccountImportEthereumTokensProps) => {
    const tokensWithBalance = A.filter(tokens, filterTokenHasBalance);

    if (A.isEmpty(tokensWithBalance)) return null;

    return (
        <Box>
            <Text>Tokens: </Text>
            <VStack spacing="small" marginBottom="small">
                {tokensWithBalance.map(({ symbol, balance, name, decimals }) => (
                    <EthereumTokenInfo
                        key={symbol}
                        symbol={symbol as EthereumTokenSymbol}
                        balance={balance}
                        decimals={decimals}
                        name={name}
                    />
                ))}
            </VStack>
        </Box>
    );
};
