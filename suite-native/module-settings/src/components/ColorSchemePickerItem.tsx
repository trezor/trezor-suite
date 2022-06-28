import React from 'react';
import { TouchableOpacity } from 'react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Color } from '@trezor/theme';
import { Box, Text } from '@suite-native/atoms';

type ColorSchemePickerItemProps = {
    isSelected?: boolean;
    onPress: () => void;
    colorSchemeItem: ColorScheme;
};

export enum ColorScheme {
    Standard = 'Standard',
    Chill = 'Chill',
    Dark = 'Dark',
}

const colorSchemeColors: Record<ColorScheme, Color[]> = {
    [ColorScheme.Standard]: ['gray400', 'gray500', 'black'],
    [ColorScheme.Chill]: ['gray500', 'gray600', 'black'],
    [ColorScheme.Dark]: ['gray600', 'gray700', 'black'],
};

const pickerItemWrapperStyle = prepareNativeStyle<{ isSelected: boolean }>(
    (utils, { isSelected }) => ({
        backgroundColor: utils.colors.gray100,
        borderRadius: utils.borders.radii.medium,
        height: 114,
        width: 109,
        paddingTop: 33,
        borderWidth: utils.borders.widths.medium,
        borderColor: isSelected ? utils.colors.green : utils.colors.gray100,
    }),
);

const pickerItemDotStyle = prepareNativeStyle<{ bgColor: Color; isFirstItem: boolean }>(
    (utils, { bgColor, isFirstItem }) => ({
        width: 26,
        height: 26,
        backgroundColor: utils.colors[bgColor],
        borderRadius: utils.borders.radii.round,
        extend: {
            condition: !isFirstItem,
            style: {
                marginLeft: -utils.spacings.small,
            },
        },
    }),
);

const textStyle = prepareNativeStyle(utils => ({
    alignSelf: 'center',
    paddingTop: 23,
    paddingBottom: utils.spacings.small,
}));

export const ColorSchemePickerItem = ({
    onPress,
    colorSchemeItem,
    isSelected = false,
}: ColorSchemePickerItemProps) => {
    const { applyStyle } = useNativeStyles();
    return (
        <TouchableOpacity
            onPress={onPress}
            style={applyStyle(pickerItemWrapperStyle, { isSelected })}
        >
            <Box flexDirection="row" justifyContent="center">
                <Box
                    style={applyStyle(pickerItemDotStyle, {
                        bgColor: colorSchemeColors[colorSchemeItem][0],
                        isFirstItem: true,
                    })}
                />
                <Box
                    style={applyStyle(pickerItemDotStyle, {
                        bgColor: colorSchemeColors[colorSchemeItem][1],
                        isFirstItem: false,
                    })}
                />
                <Box
                    style={applyStyle(pickerItemDotStyle, {
                        bgColor: colorSchemeColors[colorSchemeItem][2],
                        isFirstItem: false,
                    })}
                />
            </Box>
            <Text style={applyStyle(textStyle)} color={isSelected ? 'green' : 'gray600'}>
                {colorSchemeItem}
            </Text>
        </TouchableOpacity>
    );
};
