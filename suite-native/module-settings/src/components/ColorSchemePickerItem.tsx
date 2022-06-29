import React from 'react';
import { ColorValue, TouchableOpacity } from 'react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { colorVariants, ThemeColorVariant } from '@trezor/theme';
import { Box, Text } from '@suite-native/atoms';

type ColorSchemePickerItemProps = {
    isSelected?: boolean;
    onPress: () => void;
    colorScheme: ThemeColorVariant;
};

const pickerItemWrapperStyle = prepareNativeStyle<{ isSelected: boolean }>(
    (utils, { isSelected }) => ({
        backgroundColor: utils.colors.gray100,
        borderRadius: utils.borders.radii.medium,
        height: 114,
        flex: 1,
        paddingTop: 33,
        borderWidth: utils.borders.widths.medium,
        borderColor: isSelected ? utils.colors.green : utils.colors.gray100,
    }),
);

type PickerItemDotStyleProps = {
    backgroundColor: ColorValue;
    isFirstItem: boolean;
};
const pickerItemDotStyle = prepareNativeStyle<PickerItemDotStyleProps>(
    (utils, { backgroundColor, isFirstItem }) => ({
        width: 26,
        height: 26,
        backgroundColor,
        borderRadius: utils.borders.radii.round,
        extend: {
            condition: !isFirstItem,
            style: {
                marginLeft: utils.negative(utils.spacings.small),
            },
        },
    }),
);

const textStyle = prepareNativeStyle(utils => ({
    alignSelf: 'center',
    paddingTop: 23,
    paddingBottom: utils.spacings.small,
    textTransform: 'capitalize',
}));

export const ColorSchemePickerItem = ({
    onPress,
    colorScheme,
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
                        backgroundColor: colorVariants[colorScheme].gray400,
                        isFirstItem: true,
                    })}
                />
                <Box
                    style={applyStyle(pickerItemDotStyle, {
                        backgroundColor: colorVariants[colorScheme].gray500,
                        isFirstItem: false,
                    })}
                />
                <Box
                    style={applyStyle(pickerItemDotStyle, {
                        backgroundColor: colorVariants[colorScheme].black,
                        isFirstItem: false,
                    })}
                />
            </Box>
            <Text style={applyStyle(textStyle)} color={isSelected ? 'green' : 'gray600'}>
                {colorScheme}
            </Text>
        </TouchableOpacity>
    );
};
