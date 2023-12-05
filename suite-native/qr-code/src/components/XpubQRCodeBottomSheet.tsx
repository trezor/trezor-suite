import { useState } from 'react';

import { Box, Button, BottomSheet, BottomSheetProps, VStack } from '@suite-native/atoms';
import { networks, NetworkSymbol, NetworkType } from '@suite-common/wallet-config';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { useCopyToClipboard } from '@suite-native/helpers';

import { XpubQRCodeCard } from './XpubQRCodeCard';

type XpubQRCodeBottomSheetProps = Pick<BottomSheetProps, 'isVisible'> & {
    onClose: () => void;
    qrCodeData?: string;
    networkSymbol: NetworkSymbol;
};

const networkTypeToSheetTitleMap: Record<NetworkType, string> = {
    bitcoin: 'Public key (XPUB)',
    cardano: 'Public key (XPUB)',
    ethereum: 'Receive address',
    ripple: 'Receive address',
    solana: 'Receive address',
};

const buttonStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.medium,
}));

const networkSymbolHasXpub = (networkSymbol: NetworkSymbol) => {
    // These coins don't have XPUB but public address instead
    if (networkSymbol === 'eth' || networkSymbol === 'xrp' || networkSymbol === 'etc') return false;
    return true;
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
