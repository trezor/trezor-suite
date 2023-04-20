import React from 'react';

import { A } from '@mobily/ts-belt';

import { Box, VStack, Text } from '@suite-native/atoms';
import { TokenInfo } from '@trezor/blockchain-link-types';
import { TokenAddress, TokenSymbol } from '@suite-common/wallet-types';

import { EthereumTokenInfo } from './EthereumTokenInfo';

type AccountImportEthereumTokensProps = {
    tokens: TokenInfo[];
};

export const AccountImportEthereumTokens = ({ tokens }: AccountImportEthereumTokensProps) => {
    if (A.isEmpty(tokens)) return null;

    return (
        <Box marginTop="medium">
            <Text variant="titleSmall">Tokens: </Text>
            <VStack spacing="small" marginBottom="small">
                {tokens.map(({ symbol, contract, balance, name, decimals }) => (
                    <EthereumTokenInfo
                        key={contract}
                        symbol={symbol as TokenSymbol}
                        balance={balance}
                        decimals={decimals}
                        name={name}
                        contract={contract as TokenAddress}
                    />
                ))}
            </VStack>
        </Box>
    );
};
