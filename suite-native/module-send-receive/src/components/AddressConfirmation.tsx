import React from 'react';

import { Button, Text, VStack } from '@suite-native/atoms';
import { sendReceiveContentType, SendReceiveContentType } from '../contentType';

type ConfirmAddressProps = {
    onChangeContent: (type: SendReceiveContentType) => void;
};

export const AddressConfirmation = ({ onChangeContent }: ConfirmAddressProps) => {
    return (
        <VStack spacing={15}>
            <Text variant="titleSmall">
                Account is imported. Address verification is not possible.
            </Text>
            <Button
                size="large"
                onPress={() => onChangeContent(sendReceiveContentType.generatedAddressToReceive)}
            >
                Continue with unverified address
            </Button>
        </VStack>
    );
};
