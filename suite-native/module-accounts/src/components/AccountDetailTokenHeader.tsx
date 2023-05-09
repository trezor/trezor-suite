import React from 'react';
import { useSelector } from 'react-redux';

import { HStack, VStack } from '@suite-native/atoms';
import {
    EthereumTokenAmountFormatter,
    EthereumTokenToFiatAmountFormatter,
} from '@suite-native/formatters';
import { EthereumTokenIcon } from '@suite-common/icons';
import {
    selectEthereumAccountToken,
    getEthereumTokenIconName,
} from '@suite-native/ethereum-tokens';
import { AccountsRootState } from '@suite-common/wallet-core';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';

type AccountDetailTokenHeaderProps = {
    accountKey: AccountKey;
    tokenContract: TokenAddress;
};

export const AccountDetailTokenHeader = ({
    accountKey,
    tokenContract,
}: AccountDetailTokenHeaderProps) => {
    const tokenAccount = useSelector((state: AccountsRootState) =>
        selectEthereumAccountToken(state, accountKey, tokenContract),
    );

    if (!tokenAccount || !tokenAccount.balance) return null;

    const ethereumTokenIcon = getEthereumTokenIconName(tokenAccount.symbol);

    return (
        <VStack alignItems="center" spacing="small" marginVertical="medium">
            <HStack spacing="small" flexDirection="row" alignItems="center" justifyContent="center">
                <EthereumTokenIcon name={ethereumTokenIcon} size="extraSmall" />
                <EthereumTokenAmountFormatter
                    value={tokenAccount?.balance}
                    ethereumToken={tokenAccount.symbol}
                />
            </HStack>
            <EthereumTokenToFiatAmountFormatter
                variant="titleLarge"
                contract={tokenAccount.contract}
                value={tokenAccount?.balance}
                ethereumToken={tokenAccount.symbol}
                numberOfLines={1}
                adjustsFontSizeToFit
            />
        </VStack>
    );
};
