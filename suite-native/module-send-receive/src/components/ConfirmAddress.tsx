import React from 'react';

import { Box, Button, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { sendReceiveContentType, SendReceiveContentType } from '../contentType';

const buttonsWrapperStyle = prepareNativeStyle(utils => ({
    marginBottom: utils.spacings.extraLarge,
}));

type ConfirmAddressProps = {
    onChangeContent: (type: SendReceiveContentType) => void;
};

export const ConfirmAddress = ({ onChangeContent }: ConfirmAddressProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box flexDirection="column" style={applyStyle(buttonsWrapperStyle)}>
            <Text variant="highlight">
                Account is imported. Address verification is not possible.
            </Text>
            <Button
                size="large"
                onPress={() => onChangeContent(sendReceiveContentType.generatedAddressToReceive)}
            >
                Continue with unverified address
            </Button>
        </Box>
    );
};
