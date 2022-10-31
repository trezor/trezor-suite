import React from 'react';

import { Icon } from '@trezor/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, Button } from '@suite-native/atoms';

type XpubImportSectionProps = {
    onRequestCamera: () => void;
};

const iconWrapperStyle = prepareNativeStyle(_ => ({
    paddingVertical: 75,
}));

const importSectionWrapperStyle = prepareNativeStyle(_ => ({
    width: '100%',
}));

export const XpubImportSection = ({ onRequestCamera }: XpubImportSectionProps) => {
    const { applyStyle } = useNativeStyles();
    return (
        <Box style={applyStyle(importSectionWrapperStyle)}>
            <Box justifyContent="center" alignItems="center" style={applyStyle(iconWrapperStyle)}>
                <Icon name="qrCodeImport" customSize={176} />
            </Box>
            <Button size="large" onPress={onRequestCamera}>
                Scan QR
            </Button>
        </Box>
    );
};
