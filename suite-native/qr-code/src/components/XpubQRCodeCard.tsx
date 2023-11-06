import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, Card, Text } from '@suite-native/atoms';

import { QRCode } from './QRCode';
import { XpubOverlayWarning } from './XpubQRCodeWarningOverlay';

const XPUB_CARD_HEIGHT = 440;

const xpubCardStyle = prepareNativeStyle(utils => ({
    height: XPUB_CARD_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: utils.spacings.s,
    marginTop: utils.spacings.s,
}));

export const XpubQRCodeCard = ({
    isXpubShown,
    qrCodeData,
}: {
    isXpubShown: boolean;
    qrCodeData: string;
}) => {
    const { applyStyle } = useNativeStyles();
    return (
        <Card style={applyStyle(xpubCardStyle)}>
            {isXpubShown ? (
                <>
                    <QRCode data={qrCodeData} />
                    <Box margin="s" alignItems="center" justifyContent="center">
                        <Text textAlign="center">{qrCodeData}</Text>
                    </Box>
                </>
            ) : (
                <XpubOverlayWarning />
            )}
        </Card>
    );
};
