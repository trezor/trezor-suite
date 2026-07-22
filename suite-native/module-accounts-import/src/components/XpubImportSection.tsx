import { type NetworkSymbol, type NetworkType, getNetworkType } from '@suite-common/wallet-config';
import { Box, Button } from '@suite-native/atoms';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

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

export const networkTypeToTitleTxKeyMap: Record<NetworkType, TxKeyPath> = {
    bitcoin: 'moduleAccountImport.xpubScanScreen.scanButton.xpub',
    cardano: 'moduleAccountImport.xpubScanScreen.scanButton.xpub',
    ethereum: 'moduleAccountImport.xpubScanScreen.scanButton.address',
    ripple: 'moduleAccountImport.xpubScanScreen.scanButton.address',
    solana: 'moduleAccountImport.xpubScanScreen.scanButton.address',
    stellar: 'moduleAccountImport.xpubScanScreen.scanButton.address',
    tron: 'moduleAccountImport.xpubScanScreen.scanButton.address',
};

export const XpubImportSection = ({ onRequestCamera, symbol }: XpubImportSectionProps) => {
    const { applyStyle } = useNativeStyles();

    const networkType = getNetworkType(symbol);
    const buttonTitleTxKey = networkTypeToTitleTxKeyMap[networkType];

    return (
        <Box style={applyStyle(importSectionWrapperStyle)}>
            <Box justifyContent="center" alignItems="center" style={applyStyle(iconWrapperStyle)}>
                <QrWithLaser />
            </Box>
            <Button onPress={onRequestCamera}>
                <Translation id={buttonTitleTxKey} />
            </Button>
        </Box>
    );
};
