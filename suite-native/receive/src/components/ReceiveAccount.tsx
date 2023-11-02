import { useState } from 'react';
import { useSelector } from 'react-redux';

import { G } from '@mobily/ts-belt';

import { ErrorMessage, VStack, Box } from '@suite-native/atoms';
import { analytics, EventType } from '@suite-native/analytics';
import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';

import { useAccountReceiveAddress } from '../hooks/useAccountReceiveAddress';
import { ConfirmOnTrezorImage } from './ConfirmOnTrezorImage';
import { ReceiveAddressCard } from './ReceiveAddressCard';
import { ReceiveAccountDetailsCard } from './ReceiveAccountDetailsCard';

type AccountReceiveProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

export const ReceiveAccount = ({ accountKey, tokenContract }: AccountReceiveProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const { address, isReceiveApproved, isUnverifiedAddressRevealed, handleShowAddress } =
        useAccountReceiveAddress(accountKey);

    const isAccountDetailVisible = !isUnverifiedAddressRevealed && !isReceiveApproved;

    if (G.isNullable(account) || G.isNullable(address))
        return <ErrorMessage errorMessage="Something went wrong" />;

    return (
        <Box flex={1}>
            <VStack spacing={12}>
                {isAccountDetailVisible && (
                    <ReceiveAccountDetailsCard
                        accountKey={accountKey}
                        tokenContract={tokenContract}
                    />
                )}
                {/* TODO: AlertBox message */}
                <ReceiveAddressCard
                    address={address}
                    isReceiveApproved={isReceiveApproved}
                    isUnverifiedAddressRevealed={isUnverifiedAddressRevealed}
                    onShowAddress={handleShowAddress}
                />
            </VStack>

            {isUnverifiedAddressRevealed && !isReceiveApproved && <ConfirmOnTrezorImage />}
        </Box>
    );
};
