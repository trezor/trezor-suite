import React from 'react';
import { useSelector } from 'react-redux';

import { Button, Text, VStack } from '@suite-native/atoms';
import { AccountListItem } from '@suite-native/accounts';
import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';

import { sendReceiveContentType, SendReceiveContentType } from '../contentType';

type AddressConfirmationStepProps = {
    accountKey: string;
    onChangeContentType: (type: SendReceiveContentType) => void;
};

export const AddressConfirmationStep = ({
    accountKey,
    onChangeContentType,
}: AddressConfirmationStepProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    if (!account) return null;

    return (
        <VStack spacing={15}>
            <AccountListItem key={account.key} account={account} />
            <Text variant="titleSmall">
                Account is imported. Address verification is not possible.
            </Text>
            <Button
                size="large"
                onPress={() =>
                    onChangeContentType(sendReceiveContentType.generatedAddressToReceive)
                }
            >
                Continue with unverified address
            </Button>
        </VStack>
    );
};
