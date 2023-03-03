import React from 'react';

import { Box, VStack, Text } from '@suite-native/atoms';
import { TokenInfo } from '@trezor/blockchain-link';
import { EthereumTokenSymbol, filterTokenHasBalance } from '@suite-native/ethereum-tokens';

import { EthereumTokenInfo } from './EthereumTokenInfo';

type AccountImportEthereumTokensProps = {
    tokens: TokenInfo[];
};

export const AccountImportEthereumTokens = ({ tokens }: AccountImportEthereumTokensProps) => {
    const tokensWithBalance = tokens.filter(filterTokenHasBalance);

    return (
        <Box>
            <Text>Tokens: </Text>
            <VStack spacing="small" marginBottom="small">
                {tokensWithBalance.map(({ symbol, balance, name }) => (
                    <EthereumTokenInfo
                        key={symbol}
                        symbol={symbol as EthereumTokenSymbol}
                        balance={balance}
                        name={name}
                    />
                ))}
            </VStack>
        </Box>
    );
};
