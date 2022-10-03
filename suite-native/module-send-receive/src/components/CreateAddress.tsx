import React from 'react';

import { Box, Button } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { sendReceiveContentType, SendReceiveContentType } from '../contentType';

const buttonsWrapperStyle = prepareNativeStyle(utils => ({
    marginBottom: utils.spacings.extraLarge,
}));

type CreateAddressProps = {
    onChangeContent: (type: SendReceiveContentType) => void;
};

export const CreateAddress = ({ onChangeContent }: CreateAddressProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box flexDirection="column" style={applyStyle(buttonsWrapperStyle)}>
            <Button
                size="large"
                onPress={() => onChangeContent(sendReceiveContentType.confirmNewAddressToReceive)}
            >
                Generate a new address
            </Button>
        </Box>
    );
};
