import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import React from 'react';
import { Box } from './Box';

const dividerStyle = prepareNativeStyle(utils => ({
    borderBottomWidth: utils.borders.widths.small,
    borderBottomColor: utils.colors.gray300,
}));

export const Divider = () => {
    const { applyStyle } = useNativeStyles();

    return <Box style={applyStyle(dividerStyle)} />;
};
