// This is the iOS implementation selected by Metro through the `.ios` filename suffix.
import ViewShot from 'react-native-view-shot';

import { Card } from '@suite-native/atoms';
import { ClipboardCopyMenu } from '@suite-native/clipboard';
import { useTranslate } from '@suite-native/intl';
import { useNativeStyles } from '@trezor/styles-native';

import {
    RECEIVE_QR_CODE_PADDING,
    receiveQRCodeCardStyle,
    receiveQRCodeContainerStyle,
} from './ReceiveQRCodeCard.styles';
import type { ReceiveQRCodeCardProps } from './ReceiveQRCodeCard.types';
import { ReceiveQRCodeContent } from './ReceiveQRCodeContent';
import { useReceiveQRCodeActions } from '../hooks/useReceiveQRCodeActions.ios';

export const ReceiveQRCodeCard = ({
    onCopyAddress,
    ...qrCodeContentProps
}: ReceiveQRCodeCardProps) => {
    const {
        applyStyle,
        utils: { spacings },
    } = useNativeStyles();
    const { translate } = useTranslate();
    const { qrCodeViewRef, handleCopyQRCode, handleSaveQRCode, handleShareQRCode } =
        useReceiveQRCodeActions();
    const qrCodePadding = spacings[RECEIVE_QR_CODE_PADDING] * 2;

    return (
        <ClipboardCopyMenu
            menuActions={[
                {
                    label: translate('moduleReceive.addressActions.shareQRCodeImage'),
                    systemImage: 'square.and.arrow.up',
                    onPress: handleShareQRCode,
                },
                {
                    label: translate('moduleReceive.addressActions.saveQRCodeImage'),
                    systemImage: 'square.and.arrow.down',
                    onPress: handleSaveQRCode,
                },
                {
                    label: translate('generic.buttons.copy'),
                    systemImage: 'qrcode',
                    onPress: handleCopyQRCode,
                },
                {
                    label: translate('moduleReceive.addressActions.copyAddress'),
                    systemImage: 'doc.on.doc',
                    onPress: onCopyAddress,
                },
            ]}
        >
            <Card noPadding noShadow style={applyStyle(receiveQRCodeCardStyle)}>
                <ViewShot
                    ref={qrCodeViewRef}
                    options={{ fileName: 'trezor-receive-address-qr', format: 'png' }}
                    style={applyStyle(receiveQRCodeContainerStyle, {
                        qrCodeSize: qrCodeContentProps.qrCodeSize,
                        paddingHorizontal: qrCodePadding,
                        paddingVertical: qrCodePadding,
                    })}
                >
                    <ReceiveQRCodeContent {...qrCodeContentProps} />
                </ViewShot>
            </Card>
        </ClipboardCopyMenu>
    );
};
