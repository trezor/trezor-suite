import { Pressable } from 'react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Card, Text } from '@suite-native/atoms';
import { useCopyToClipboard } from '@suite-native/helpers';
import { useTranslate } from '@suite-native/intl';

import { QRCode } from './QRCode';
import { XpubOverlayWarning } from './XpubQRCodeWarningOverlay';

const XPUB_CARD_HEIGHT = 440;

const xpubCardStyle = prepareNativeStyle(utils => ({
    height: XPUB_CARD_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: utils.spacings.small,
    marginTop: utils.spacings.small,
}));

const xpubCardTextContainerStyle = prepareNativeStyle(utils => ({
    marginTop: utils.spacings.small,
    alignItems: 'center',
    justifyContent: 'center',
}));

export const XpubQRCodeCard = ({
    isXpubShown,
    qrCodeData,
}: {
    isXpubShown: boolean;
    qrCodeData: string;
}) => {
    const { applyStyle } = useNativeStyles();
    const copyToClipboard = useCopyToClipboard();
    const { translate } = useTranslate();

    const handleCopy = () => {
        copyToClipboard(qrCodeData, translate('qrCode.addressCopied'));
    };

    return (
        <Card style={applyStyle(xpubCardStyle)}>
            {isXpubShown ? (
                <>
                    <QRCode data={qrCodeData} />
                    <Pressable
                        onLongPress={handleCopy}
                        style={applyStyle(xpubCardTextContainerStyle)}
                    >
                        <Text textAlign="center">{qrCodeData}</Text>
                    </Pressable>
                </>
            ) : (
                <XpubOverlayWarning />
            )}
        </Card>
    );
};
