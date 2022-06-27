import React from 'react';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, Text } from '@suite-native/atoms';
import { Color } from '@trezor/theme';

type ColorSchemePickerItemProps = {
    title: string;
    isSelected?: boolean;
};

const pickerItemWrapperStyle = prepareNativeStyle<{ isSelected: boolean }>(
    (utils, { isSelected }) => ({
        flex: 1,
        backgroundColor: utils.colors.gray100,
        borderRadius: utils.borders.radii.medium,
        height: 114,
        borderWidth: utils.borders.widths.small,
        borderColor: isSelected ? utils.colors.forest : utils.colors.gray100,
    }),
);

const pickerItemDotStyle = prepareNativeStyle<{ bgColor: Color }>((utils, { bgColor }) => ({
    width: 26,
    height: 26,
    backgroundColor: utils.colors[bgColor],
    borderRadius: utils.borders.radii.round,
}));

export const ColorSchemePickerItem = ({
    title,
    isSelected = false,
}: ColorSchemePickerItemProps) => {
    const { applyStyle } = useNativeStyles();
    return (
        <Box style={applyStyle(pickerItemWrapperStyle, { isSelected })}>
            <Box flexDirection="row">
                <Box style={applyStyle(pickerItemDotStyle, { bgColor: 'gray400' })} />
                <Box style={applyStyle(pickerItemDotStyle, { bgColor: 'gray500' })} />
                <Box style={applyStyle(pickerItemDotStyle, { bgColor: 'gray600' })} />
            </Box>
            <Text>{title}</Text>
        </Box>
    );
};
