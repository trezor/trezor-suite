import React from 'react';
import Clipboard from '@react-native-clipboard/clipboard';
import { Share, View } from 'react-native';
import QRCode from 'react-qr-code';

import { Box, Button, HStack, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { defaultColorVariant } from '@trezor/theme';

type GeneratedAddressProps = {
    address: string;
    onClose: () => void;
};

export const QRCODE_SIZE = 197;
export const QRCODE_PADDING = 12;

const qrCodeWrapperStyle = prepareNativeStyle(_ => ({
    padding: QRCODE_PADDING,
    alignItems: 'center',
    justifyContent: 'center',
}));

const actionButtonsStyle = prepareNativeStyle(_ => ({
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
}));

export const FreshAddress = ({ address, onClose }: GeneratedAddressProps) => {
    const { applyStyle } = useNativeStyles();

    const handleShareAddress = async () => {
        try {
            const result = await Share.share({
                message: address,
            });
            if (result.action === Share.sharedAction) {
                onClose();
            }
        } catch (error) {
            alert(error.message);
        }
    };

    const handleCopyAddressToClipboardAndClose = () => {
        Clipboard.setString(address);
        onClose();
    };

    return (
        <Box>
            <View style={applyStyle(qrCodeWrapperStyle)}>
                <QRCode
                    bgColor={defaultColorVariant.gray0}
                    fgColor={defaultColorVariant.gray900}
                    level="Q"
                    size={QRCODE_SIZE}
                    value={address}
                />
            </View>
            <Box margin="small" alignItems="center" justifyContent="center">
                <Text variant="body">{address}</Text>
            </Box>
            <HStack spacing={15} style={applyStyle(actionButtonsStyle)}>
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
