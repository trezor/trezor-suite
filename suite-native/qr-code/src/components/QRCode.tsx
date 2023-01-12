import React from 'react';
import { Alert, Share, View } from 'react-native';
import ReactQRCode from 'react-qr-code';

import * as Clipboard from 'expo-clipboard';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, Button, HStack, Text } from '@suite-native/atoms';
import { colorVariants } from '@trezor/theme';

type QRCodeProps = {
    data?: string;
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

export const QRCode = ({ data, onCopy }: QRCodeProps) => {
    const { applyStyle } = useNativeStyles();

    if (!data) return null;

    const handleSharedata = async () => {
        try {
            await Share.share({
                message: data,
            });
        } catch (error) {
            Alert.alert('Something went wrong.', error.message);
        }
    };

    const handleCopy = async () => {
        await Clipboard.setStringAsync(data);
        onCopy();
    };

    return (
        <>
            <View style={applyStyle(qrCodeStyle)}>
                {data && (
                    <ReactQRCode
                        bgColor={colorVariants.standard.gray0}
                        fgColor={colorVariants.standard.gray900}
                        level="Q"
                        size={QRCODE_SIZE}
                        value={data}
                    />
                )}
            </View>
            <Box margin="small" alignItems="center" justifyContent="center">
                <Text variant="body">{data}</Text>
            </Box>
            <HStack spacing={15} style={applyStyle(actionButtonsStyle)}>
                <Button size="large" colorScheme="gray" onPress={handleSharedata}>
                    Share
                </Button>
                <Button size="large" onPress={handleCopy}>
                    Copy & Close
                </Button>
            </HStack>
        </>
    );
};
