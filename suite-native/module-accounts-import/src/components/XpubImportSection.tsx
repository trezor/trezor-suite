import React from 'react';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, Button } from '@suite-native/atoms';

import { QrWithLaser } from './QRWithLaser';

type XpubImportSectionProps = {
    onRequestCamera: () => void;
};

const iconWrapperStyle = prepareNativeStyle(_ => ({
    paddingBottom: 30,
}));

const importSectionWrapperStyle = prepareNativeStyle(_ => ({
    width: '100%',
}));

export const XpubImportSection = ({ onRequestCamera }: XpubImportSectionProps) => {
    const { applyStyle } = useNativeStyles();
    return (
        <Box style={applyStyle(importSectionWrapperStyle)}>
            <Box justifyContent="center" alignItems="center" style={applyStyle(iconWrapperStyle)}>
                <QrWithLaser />
            </Box>
            <Button size="large" onPress={onRequestCamera}>
                Scan QR
            </Button>
        </Box>
    );
};
