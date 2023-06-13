import React, { useState } from 'react';
import { useSelector } from 'react-redux';

import { G } from '@mobily/ts-belt';

import { Box, ErrorMessage, Text, VStack } from '@suite-native/atoms';
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
    const [isAddressVisible, setIsAddressVisible] = useState(false);

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
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
            {tokenContract ? (
                <TokenReceiveCard contract={tokenContract} accountKey={accountKey} />
            ) : (
                <AccountListItem account={account} />
            )}
            <Box marginLeft="small">
                <Text variant="hint" color="textSubdued">
                    Address
                </Text>
            </Box>
            {isAddressVisible ? (
                <ReceiveAddress accountKey={accountKey} backgroundElevation="1" />
            ) : (
                <ReceiveTextHint onShowAddress={handleShowAddress} />
            )}
        </VStack>
    );
};
