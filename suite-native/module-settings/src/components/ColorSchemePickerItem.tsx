import React from 'react';
import { TouchableOpacity, useColorScheme } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { Box, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { colorVariants, CSSColor, ThemeColorVariant } from '@trezor/theme';

import { selectIsColorSchemeActive, setColorScheme, AppColorScheme } from '../slice';

type ColorSchemePickerItemProps = {
    colorScheme: AppColorScheme;
};

const pickerItemWrapperStyle = prepareNativeStyle<{ isColorSchemeActive: boolean }>(
    (utils, { isColorSchemeActive }) => ({
        backgroundColor: utils.colors.gray100,
        borderRadius: utils.borders.radii.medium,
        height: 114,
        flex: 1,
        paddingTop: 33,
        borderWidth: utils.borders.widths.medium,
        borderColor: isColorSchemeActive ? utils.colors.green : utils.colors.gray100,
    }),
);

type PickerItemDotStyleProps = {
    backgroundColor: CSSColor;
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

// TODO: this default color variants for dark/light mode should be probably defined in some config
const useGetSystemColorVariant = (): ThemeColorVariant => {
    const colorScheme = useColorScheme();
    if (colorScheme === 'dark') {
        return 'dark';
    }
    return 'chill';
};

export const ColorSchemePickerItem = ({ colorScheme }: ColorSchemePickerItemProps) => {
    const { applyStyle } = useNativeStyles();
    const dispatch = useDispatch();

    const isColorSchemeActive = useSelector(selectIsColorSchemeActive(colorScheme));
    const systemColorVariant = useGetSystemColorVariant();
    const colorVariant = colorScheme === 'system' ? systemColorVariant : colorScheme;

    const handleSchemePress = () => {
        dispatch(setColorScheme(colorScheme));
    };

    return (
        <TouchableOpacity
            onPress={handleSchemePress}
            style={applyStyle(pickerItemWrapperStyle, { isColorSchemeActive })}
        >
            <Box flexDirection="row" justifyContent="center">
                <Box
                    style={applyStyle(pickerItemDotStyle, {
                        backgroundColor: colorVariants[colorVariant].gray400,
                        isFirstItem: true,
                    })}
                />
                <Box
                    style={applyStyle(pickerItemDotStyle, {
                        backgroundColor: colorVariants[colorVariant].gray500,
                        isFirstItem: false,
                    })}
                />
                <Box
                    style={applyStyle(pickerItemDotStyle, {
                        backgroundColor: colorVariants[colorVariant].gray1000,
                        isFirstItem: false,
                    })}
                />
            </Box>
            <Text style={applyStyle(textStyle)} color={isColorSchemeActive ? 'green' : 'gray600'}>
                {colorScheme}
            </Text>
        </TouchableOpacity>
    );
};
