// This is the Android implementation selected by Metro as the unsuffixed fallback.
import { Box, Card } from '@suite-native/atoms';
import { ClipboardCopyMenu } from '@suite-native/clipboard';
import { useNativeStyles } from '@trezor/styles-native';

import {
    RECEIVE_QR_CODE_PADDING,
    receiveQRCodeCardStyle,
    receiveQRCodeContainerStyle,
} from './ReceiveQRCodeCard.styles';
import type { ReceiveQRCodeCardProps } from './ReceiveQRCodeCard.types';
import { ReceiveQRCodeContent } from './ReceiveQRCodeContent';

export const ReceiveQRCodeCard = ({
    onCopyAddress,
    ...qrCodeContentProps
}: ReceiveQRCodeCardProps) => {
    const {
        applyStyle,
        utils: { spacings },
    } = useNativeStyles();
    const qrCodePadding = spacings[RECEIVE_QR_CODE_PADDING] * 2;

    return (
        <ClipboardCopyMenu onCopy={onCopyAddress}>
            <Card noPadding noShadow style={applyStyle(receiveQRCodeCardStyle)}>
                <Box
                    style={applyStyle(receiveQRCodeContainerStyle, {
                        qrCodeSize: qrCodeContentProps.qrCodeSize,
                        paddingHorizontal: qrCodePadding,
                        paddingVertical: qrCodePadding,
                    })}
                >
                    <ReceiveQRCodeContent {...qrCodeContentProps} />
                </Box>
            </Card>
        </ClipboardCopyMenu>
    );
};
