import { type NetworkSymbol, type NetworkType, getNetworkType } from '@suite-common/wallet-config';
import { Box, Button } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { QrWithLaser } from './QRWithLaser';

type XpubImportSectionProps = {
    onRequestCamera: () => void;
    symbol: NetworkSymbol;
};

const iconWrapperStyle = prepareNativeStyle(_ => ({
    paddingBottom: 30,
}));

const importSectionWrapperStyle = prepareNativeStyle(_ => ({
    width: '100%',
}));

export const networkTypeToTitleMap: Record<NetworkType, string> = {
    bitcoin: 'Scan public key (XPUB)',
    cardano: 'Scan public key (XPUB)',
    ethereum: 'Scan receive address',
    ripple: 'Scan receive address',
    solana: 'Scan receive address',
};

export const XpubImportSection = ({ onRequestCamera, symbol }: XpubImportSectionProps) => {
    const { applyStyle } = useNativeStyles();

    const networkType = getNetworkType(symbol);
    const buttonTitle = networkTypeToTitleMap[networkType];

    return (
        <Box style={applyStyle(importSectionWrapperStyle)}>
            <Box justifyContent="center" alignItems="center" style={applyStyle(iconWrapperStyle)}>
                <QrWithLaser />
            </Box>
            <Button size="large" onPress={onRequestCamera}>
                {buttonTitle}
            </Button>
        </Box>
    );
};
