import React from 'react';
import { useSelector } from 'react-redux';

import { HStack, VStack } from '@suite-native/atoms';
import {
    EthereumTokenAmountFormatter,
    EthereumTokenToFiatAmountFormatter,
} from '@suite-native/formatters';
import { EthereumTokenIcon } from '@trezor/icons';
import {
    selectEthereumAccountToken,
    getEthereumTokenIconName,
} from '@suite-native/ethereum-tokens';
import { AccountsRootState } from '@suite-common/wallet-core';
import { AccountKey, TokenSymbol } from '@suite-common/wallet-types';

type AccountDetailTokenHeaderProps = {
    accountKey: AccountKey;
    tokenSymbol: TokenSymbol;
};

export const AccountDetailTokenHeader = ({
    accountKey,
    tokenSymbol,
}: AccountDetailTokenHeaderProps) => {
    const tokenAccount = useSelector((state: AccountsRootState) =>
        selectEthereumAccountToken(state, accountKey, tokenSymbol),
    );

    if (!tokenAccount || !tokenAccount.balance) return null;

    const ethereumTokenIcon = getEthereumTokenIconName(tokenSymbol);

    return (
        <VStack alignItems="center" spacing="small" marginVertical="medium">
            <HStack spacing="small" flexDirection="row" alignItems="center" justifyContent="center">
                <EthereumTokenIcon name={ethereumTokenIcon} size="extraSmall" />
                <EthereumTokenAmountFormatter
                    value={tokenAccount?.balance}
                    ethereumToken={tokenSymbol}
                />
            </HStack>
            <EthereumTokenToFiatAmountFormatter
                variant="titleLarge"
                contract={tokenAccount.contract}
                value={tokenAccount?.balance}
                ethereumToken={tokenSymbol}
                numberOfLines={1}
                adjustsFontSizeToFit
            />
        </VStack>
    );
};
