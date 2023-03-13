import React from 'react';
import { useSelector } from 'react-redux';

import { Box, VStack, Text } from '@suite-native/atoms';
import {
    EthereumTokenSymbol,
    selectEthereumAccountTokensWithBalance,
} from '@suite-native/ethereum-tokens';
import { AccountsRootState } from '@suite-common/wallet-core';

import { EthereumTokenInfo } from './EthereumTokenInfo';

type AccountImportEthereumTokensProps = {
    accountKey: string;
};

export const AccountImportEthereumTokens = ({ accountKey }: AccountImportEthereumTokensProps) => {
    const tokensWithBalance = useSelector((state: AccountsRootState) =>
        selectEthereumAccountTokensWithBalance(state, accountKey),
    );

    if (!tokensWithBalance) return null;

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
