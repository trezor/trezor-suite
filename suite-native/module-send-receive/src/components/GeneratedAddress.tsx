import React from 'react';
import Clipboard from '@react-native-clipboard/clipboard';
import { Share } from 'react-native';

import { Box, Button, HStack, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const buttonsWrapperStyle = prepareNativeStyle(utils => ({
    marginBottom: utils.spacings.extraLarge,
}));

type GeneratedAddressProps = {
    onClose: () => void;
};

export const GeneratedAddress = ({ onClose }: GeneratedAddressProps) => {
    const { applyStyle } = useNativeStyles();

    const handleShareAddress = async () => {
        try {
            const result = await Share.share({
                message: 'TODO address',
            });
            if (result.action === Share.sharedAction) {
                onClose();
            }
        } catch (error) {
            alert(error.message);
        }
    };

    const handleCopyAddressToClipboardAndClose = () => {
        Clipboard.setString('hello world');
        onClose();
    };

    return (
        <Box flexDirection="column" style={applyStyle(buttonsWrapperStyle)}>
            <Text variant="highlight">QR code</Text>
            <HStack spacing={10}>
                <Button size="large" colorScheme="gray" onPress={handleShareAddress}>
                    Share
                </Button>
                <Button size="large" onPress={handleCopyAddressToClipboardAndClose}>
                    Copy & Close
                </Button>
            </HStack>
        </Box>
    );
};
