import ViewShot from 'react-native-view-shot';

import { Card, ContextMenu } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { useNativeStyles } from '@trezor/styles-native';

import {
    RECEIVE_QR_CODE_PADDING,
    receiveQRCodeCardStyle,
    receiveQRCodeContainerStyle,
} from './ReceiveQRCodeCard.styles';
import type { ReceiveQRCodeCardProps } from './ReceiveQRCodeCard.types';
import { ReceiveQRCodeContent } from './ReceiveQRCodeContent';
import { useReceiveQRCodeActions } from '../hooks/useReceiveQRCodeActions';

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
        <ContextMenu
            actions={[
                {
                    label: translate('moduleReceive.addressActions.shareQRCodeImage'),
                    icon: 'share',
                    onPress: handleShareQRCode,
                },
                {
                    label: translate('moduleReceive.addressActions.saveQRCodeImage'),
                    icon: 'download',
                    onPress: handleSaveQRCode,
                },
                {
                    label: translate('generic.buttons.copy'),
                    icon: 'qrCode',
                    onPress: handleCopyQRCode,
                },
                {
                    label: translate('moduleReceive.addressActions.copyAddress'),
                    icon: 'copy',
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
        </ContextMenu>
    );
};
