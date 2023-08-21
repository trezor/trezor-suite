import React, { useState } from 'react';

import {
    Box,
    Text,
    Button,
    Card,
    BottomSheet,
    BottomSheetProps,
    VStack,
} from '@suite-native/atoms';
import { networks, NetworkSymbol, NetworkType } from '@suite-common/wallet-config';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { useCopyToClipboard } from '@suite-native/helpers';

import { QRCode } from './QRCode';
import { XpubOverlayWarning } from './XpubQRCodeWarningOverlay';

type XpubQRCodeBottomSheetProps = Pick<BottomSheetProps, 'isVisible'> & {
    onClose: () => void;
    qrCodeData?: string;
    networkSymbol: NetworkSymbol;
};

const XPUB_CARD_HEIGHT = 440;

const networkTypeToSheetTitleMap: Record<NetworkType, string> = {
    bitcoin: 'Public key (XPUB)',
    cardano: 'Public key (XPUB)',
    ethereum: 'Receive address',
    ripple: 'Receive address',
};

const xpubCardStyle = prepareNativeStyle(utils => ({
    height: XPUB_CARD_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: utils.spacings.small,
    marginTop: utils.spacings.small,
}));

const buttonStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.medium,
}));

const networkSymbolHasXpub = (networkSymbol: NetworkSymbol) => {
    // These coins don't have XPUB but public address instead
    if (networkSymbol === 'eth' || networkSymbol === 'xrp' || networkSymbol === 'etc') return false;
    return true;
};

const XpubQRCodeCard = ({
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
                    <Box margin="small" alignItems="center" justifyContent="center">
                        <Text align="center">{qrCodeData}</Text>
                    </Box>
                </>
            ) : (
                <XpubOverlayWarning />
            )}
        </Card>
    );
};

export const XpubQRCodeBottomSheet = ({
    isVisible,
    onClose,
    qrCodeData,
    networkSymbol,
}: XpubQRCodeBottomSheetProps) => {
    const { applyStyle } = useNativeStyles();
    const copyToClipboard = useCopyToClipboard();
    const [isXpubShown, setIsXpubShown] = useState(!networkSymbolHasXpub(networkSymbol));

    if (!qrCodeData) return null;

    const { networkType } = networks[networkSymbol];

    const copyMessage = networkSymbolHasXpub(networkSymbol)
        ? 'XPUB copied'
        : 'Public address copied';

    const handleShowXpub = () => {
        setIsXpubShown(true);
    };

    const handleCopyXpub = async () => {
        await copyToClipboard(qrCodeData, copyMessage);
        onClose();
    };

    return (
        <BottomSheet
            title={networkTypeToSheetTitleMap[networkType]}
            isVisible={isVisible}
            onClose={onClose}
        >
            <VStack spacing="large">
                <XpubQRCodeCard isXpubShown={isXpubShown} qrCodeData={qrCodeData} />

                <Box style={applyStyle(buttonStyle)}>
                    {isXpubShown ? (
                        <Button size="large" onPress={handleCopyXpub}>
                            Copy
                        </Button>
                    ) : (
                        <Button size="large" iconLeft="eye" onPress={handleShowXpub}>
                            Show public key
                        </Button>
                    )}
                </Box>
            </VStack>
        </BottomSheet>
    );
};
