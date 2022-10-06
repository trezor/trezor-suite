import React from 'react';
import { useSelector } from 'react-redux';

import { Button, VStack } from '@suite-native/atoms';
import { AccountListItem } from '@suite-native/accounts';
import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';

import { sendReceiveContentType, SendReceiveContentType } from '../contentType';

type AddressGenerationStepProps = {
    onChangeContentType: (type: SendReceiveContentType) => void;
    accountKey: string;
};

export const AddressGenerationStep = ({
    onChangeContentType,
    accountKey,
}: AddressGenerationStepProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    if (!account) return null;

    return (
        <VStack spacing={15}>
            <AccountListItem key={account.key} account={account} />
            <Button
                iconName="plus"
                size="large"
                onPress={() =>
                    onChangeContentType(sendReceiveContentType.confirmNewAddressToReceive)
                }
            >
                Generate a new address
            </Button>
        </VStack>
    );
};
