import React from 'react';
import { Alert, Share, View } from 'react-native';
import ReactQRCode from 'react-qr-code';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, Button, HStack, Text } from '@suite-native/atoms';
import { defaultColorVariant } from '@trezor/theme';

type QRCodeProps = {
    address?: string;
    onCopy: () => void;
};

export const QRCODE_SIZE = 197;
export const QRCODE_PADDING = 12;

const qrCodeStyle = prepareNativeStyle(_ => ({
    padding: QRCODE_PADDING,
    alignItems: 'center',
    justifyContent: 'center',
}));

const actionButtonsStyle = prepareNativeStyle(_ => ({
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
}));

export const QRCode = ({ address, onCopy }: QRCodeProps) => {
    const { applyStyle } = useNativeStyles();

    if (!address) return null;

    const handleShareAddress = async () => {
        try {
            await Share.share({
                message: address,
            });
        } catch (error) {
            Alert.alert('Something went wrong.', error.message);
        }
    };

    return (
        <>
            <View style={applyStyle(qrCodeStyle)}>
                {address && (
                    <ReactQRCode
                        bgColor={defaultColorVariant.gray0}
                        fgColor={defaultColorVariant.gray900}
                        level="Q"
                        size={QRCODE_SIZE}
                        value={address}
                    />
                )}
            </View>
            <Box margin="small" alignItems="center" justifyContent="center">
                <Text variant="body">{address}</Text>
            </Box>
            <HStack spacing={15} style={applyStyle(actionButtonsStyle)}>
                <Button size="large" colorScheme="gray" onPress={handleShareAddress}>
                    Share
                </Button>
                <Button size="large" onPress={onCopy}>
                    Copy & Close
                </Button>
            </HStack>
        </>
    );
};
