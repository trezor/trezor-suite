import React from 'react';

import { Box, Text, VStack } from '@suite-native/atoms';
import { AccountsList } from '@suite-native/accounts';

import { sendReceiveContentType, SendReceiveContentType } from '../contentType';

type AccountSelectionStepProps = {
    onChangeContentType: (type: SendReceiveContentType) => void;
    onSelectAccount: (accountKey: string) => void;
};

export const AccountSelectionStep = ({
    onChangeContentType,
    onSelectAccount,
}: AccountSelectionStepProps) => {
    const handleSelectAccount = (accountKey: string) => {
        onSelectAccount(accountKey);
        onChangeContentType(sendReceiveContentType.createNewAddressToReceive);
    };

    return (
        <Box flexDirection="column">
            <VStack spacing={10}>
                <Text variant="highlight">To account</Text>
                <AccountsList onSelectAccount={handleSelectAccount} />
            </VStack>
        </Box>
    );
};
