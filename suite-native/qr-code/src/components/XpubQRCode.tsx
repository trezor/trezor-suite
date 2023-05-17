import React, { useState } from 'react';

import { Box, Text, Button, Stack } from '@suite-native/atoms';
import { NetworkSymbol } from '@suite-common/wallet-config';

import { QRCode } from './QRCode';
import { QRCodeCopyButton } from './QRCodeCopyButton';
import { XpubOverlayWarning } from './XpubQRCodeWarningOverlay';

type XpubQRCodeProps = {
    onCopy: () => void;
    data?: string;
    networkSymbol: NetworkSymbol;
};

const networkSymbolHasXpub = (networkSymbol: NetworkSymbol) => {
    // These coins don't have XPUB but public address instead
    if (networkSymbol === 'eth' || networkSymbol === 'xrp' || networkSymbol === 'etc') return false;
    return true;
};

export const XpubQRCode = ({ data, networkSymbol, onCopy }: XpubQRCodeProps) => {
    const [isAllowedToShowXpub, setIsAllowedToShowXpub] = useState(
        !networkSymbolHasXpub(networkSymbol),
    );

    if (!data) return null;

    const handleHideXpub = () => {
        setIsAllowedToShowXpub(false);
        onCopy();
    };

    const copyMessage = networkSymbolHasXpub(networkSymbol)
        ? 'XPUB copied'
        : 'Public address copied';

    return (
        <Stack spacing="medium">
            {isAllowedToShowXpub ? (
                <>
                    <QRCode data={data} />
                    <Box margin="small" alignItems="center" justifyContent="center">
                        <Text align="center">{data}</Text>
                    </Box>
                    <QRCodeCopyButton
                        data={data}
                        onCopyMessage={copyMessage}
                        onCopy={handleHideXpub}
                    />
                </>
            ) : (
                <>
                    <XpubOverlayWarning />
                    <Button iconLeft="eye" onPress={() => setIsAllowedToShowXpub(true)}>
                        Show public key
                    </Button>
                </>
            )}
        </Stack>
    );
};
