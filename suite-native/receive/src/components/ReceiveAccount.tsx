import React, { useState } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { G } from '@mobily/ts-belt';

import { Box, ErrorMessage, Text, VStack } from '@suite-native/atoms';
import { getEthereumTokenName, selectEthereumAccountToken } from '@suite-native/ethereum-tokens';
import { AccountListItem } from '@suite-native/accounts';
import { analytics, EventType } from '@suite-native/analytics';
import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';

import { TokenReceiveCard } from './TokenReceiveCard';
import { ReceiveAddress } from './ReceiveAddress';
import { ReceiveTextHint } from './ReceiveTextHint';

type AccountReceiveProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

export const ReceiveAccount = ({ accountKey, tokenContract }: AccountReceiveProps) => {
    const navigation = useNavigation();
    const [isAddressVisible, setIsAddressVisible] = useState(false);

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const token = useSelector((state: AccountsRootState) =>
        selectEthereumAccountToken(state, accountKey, tokenContract),
    );

    if (G.isNullable(account))
        return <ErrorMessage errorMessage={`Account ${accountKey} not found.`} />;

    const handleShowAddress = () => {
        analytics.report({
            type: EventType.CreateReceiveAddressShowAddress,
            payload: { assetSymbol: account.symbol },
        });
        setIsAddressVisible(true);
    };

    return (
        <VStack spacing="medium">
            {token ? (
                <TokenReceiveCard
                    contract={token.contract}
                    accountKey={accountKey}
                    tokenSymbol={token.symbol}
                    balance={token.balance}
                    tokenName={getEthereumTokenName(token.name)}
                />
            ) : (
                <AccountListItem account={account} />
            )}
            <Box marginLeft="small">
                <Text variant="hint" color="textSubdued">
                    Address
                </Text>
            </Box>
            {isAddressVisible ? (
                <ReceiveAddress
                    accountKey={accountKey}
                    onClose={navigation.goBack}
                    backgroundElevation="1"
                />
            ) : (
                <ReceiveTextHint onShowAddress={handleShowAddress} />
            )}
        </VStack>
    );
};
