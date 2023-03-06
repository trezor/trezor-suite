import React from 'react';
import { Alert, Share, View } from 'react-native';
import ReactQRCode from 'react-qr-code';

import { useCopyToClipboard } from '@suite-native/helpers';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, Button, ButtonBackgroundElevation, Text, VStack } from '@suite-native/atoms';
import { colorVariants } from '@trezor/theme';

type QRCodeProps = {
    data?: string;
    onCopy: () => void;
    isShareEnabled?: boolean;
    backgroundElevation?: ButtonBackgroundElevation;
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

export const QRCode = ({
    data,
    onCopy,
    isShareEnabled = false,
    backgroundElevation = '0',
}: QRCodeProps) => {
    const copyToClipboard = useCopyToClipboard();

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

    const handleCopyAndClose = async () => {
        await copyToClipboard(data, 'Address copied to clipboard.');
        onCopy();
    };

    return (
        <>
            <View style={applyStyle(qrCodeStyle)}>
                {data && (
                    <ReactQRCode
                        bgColor={colorVariants.standard.backgroundSurfaceElevation1}
                        fgColor={colorVariants.standard.backgroundNeutralBold}
                        level="Q"
                        size={QRCODE_SIZE}
                        value={data}
                    />
                )}
            </View>
            <Box margin="small" alignItems="center" justifyContent="center">
                <Text variant="body">{data}</Text>
            </Box>
            <VStack spacing="small">
                {isShareEnabled && (
                    <Button
                        iconRight="share"
                        size="large"
                        colorScheme={`tertiaryElevation${backgroundElevation}`}
                        onPress={handleSharedata}
                        style={applyStyle(actionButtonsStyle)}
                    >
                        Share
                    </Button>
                )}
                <Button size="large" onPress={handleCopyAndClose}>
                    Copy & Close
                </Button>
            </VStack>
        </>
    );
};
