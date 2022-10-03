import React from 'react';

import { Button, VStack } from '@suite-native/atoms';
import { sendReceiveContentType, SendReceiveContentType } from '../contentType';

type CreateAddressProps = {
    onChangeContent: (type: SendReceiveContentType) => void;
};

export const AddressGeneration = ({ onChangeContent }: CreateAddressProps) => {
    return (
        <VStack spacing={15}>
            <Button
                size="large"
                onPress={() => onChangeContent(sendReceiveContentType.confirmNewAddressToReceive)}
            >
                Generate a new address
            </Button>
        </VStack>
    );
};
