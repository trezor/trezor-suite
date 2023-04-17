import React, { useState } from 'react';

import { Box, Button, Stack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { NetworkSymbol } from '@suite-common/wallet-config';

import { QRCode } from './QRCode';
import { QRCodeCopyAndShareButton } from './QRCodeCopyAndShareButton';
import { XpubOverlayWarning } from './XpubQRCodeWarningOverlay';

type XpubQRCodeProps = {
    onCopy: () => void;
    data?: string;
    networkSymbol: NetworkSymbol;
    onCopyMessage?: string;
};

const qrcodeWrapperStyle = prepareNativeStyle(_ => ({
    position: 'relative',
}));

const networkSymbolHasXpub = (networkSymbol: NetworkSymbol) => {
    // These coins don't have XPUB but public address instead
    if (networkSymbol === 'eth' || networkSymbol === 'xrp' || networkSymbol === 'etc') return false;
    return true;
};

export const XpubQRCode = ({
    data,
    networkSymbol,
    onCopy,
    onCopyMessage = 'XPUB copied',
}: XpubQRCodeProps) => {
    const { applyStyle } = useNativeStyles();
    const [isAllowedToShowXpub, setIsAllowedToShowXpub] = useState(
        !networkSymbolHasXpub(networkSymbol),
    );

    if (!data) return null;

    const handleCopy = () => {
        setIsAllowedToShowXpub(false);
        onCopy();
    };

    const copyMessage = networkSymbolHasXpub(networkSymbol)
        ? onCopyMessage
        : 'Public address copied';

    return (
        <Stack spacing="medium">
            <Box style={applyStyle(qrcodeWrapperStyle)}>
                {!isAllowedToShowXpub && <XpubOverlayWarning />}
                <QRCode data={data} />
            </Box>
            {!isAllowedToShowXpub ? (
                <Button iconLeft="eye" onPress={() => setIsAllowedToShowXpub(true)}>
                    Show public key
                </Button>
            ) : (
                <QRCodeCopyAndShareButton
                    data={data}
                    onCopyMessage={copyMessage}
                    onCopy={handleCopy}
                />
            )}
        </Stack>
    );
};
