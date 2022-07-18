import React from 'react';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Box } from './Box';

type ProgressBarProps = {
    value: number; // Percentage value
};

const progressBarStyle = prepareNativeStyle(utils => ({
    height: 3,
    width: 82,
    backgroundColor: utils.colors.gray200,
}));

const progressFillStyle = prepareNativeStyle<{ width: number }>((utils, { width }) => ({
    width,
    height: 3,
    backgroundColor: utils.colors.green,
}));

export const ProgressBar = ({ value }: ProgressBarProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(progressBarStyle)}>
            <Box style={applyStyle(progressFillStyle, { width: value })} />
        </Box>
    );
};
