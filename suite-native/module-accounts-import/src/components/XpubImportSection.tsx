import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, Button } from '@suite-native/atoms';
import { networks, NetworkSymbol } from '@suite-common/wallet-config';

import { QrWithLaser } from './QRWithLaser';
import { networkTypeToTitleMap } from '../screens/ScanQRCodeModalScreen';

type XpubImportSectionProps = {
    onRequestCamera: () => void;
    networkSymbol: NetworkSymbol;
};

const iconWrapperStyle = prepareNativeStyle(_ => ({
    paddingBottom: 30,
}));

const importSectionWrapperStyle = prepareNativeStyle(_ => ({
    width: '100%',
}));

export const XpubImportSection = ({ onRequestCamera, networkSymbol }: XpubImportSectionProps) => {
    const { applyStyle } = useNativeStyles();

    const { networkType } = networks[networkSymbol];
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
