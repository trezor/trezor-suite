import { TouchableOpacity } from 'react-native';

import { Box, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { colorVariants, CSSColor } from '@trezor/theme';
import { useSystemColorScheme, useUserColorScheme, AppColorScheme } from '@suite-native/theme';

type ColorSchemePickerItemProps = {
    colorScheme: AppColorScheme;
};

const pickerItemWrapperStyle = prepareNativeStyle<{ isColorSchemeActive: boolean }>(
    (utils, { isColorSchemeActive }) => ({
        backgroundColor: utils.colors.backgroundSurfaceElevationNegative,
        borderRadius: utils.borders.radii.m,
        minHeight: 114,
        flex: 1,
        paddingTop: 33,
        borderWidth: utils.borders.widths.m,
        borderColor: isColorSchemeActive
            ? utils.colors.borderSecondary
            : utils.colors.borderOnElevation0,
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
                marginLeft: utils.negative(utils.spacings.s),
            },
        },
    }),
);

const textStyle = prepareNativeStyle(utils => ({
    alignSelf: 'center',
    textAlign: 'center',
    paddingTop: 23,
    paddingBottom: utils.spacings.s,
    paddingHorizontal: utils.spacings.s,
    textTransform: 'capitalize',
}));

export const ColorSchemePickerItem = ({ colorScheme }: ColorSchemePickerItemProps) => {
    const { applyStyle } = useNativeStyles();

    const { userColorScheme, setUserColorScheme } = useUserColorScheme();
    const isColorSchemeActive = colorScheme === userColorScheme;
    const systemColorScheme = useSystemColorScheme();

    const colorVariant = colorScheme === 'system' ? systemColorScheme : colorScheme;

    const handleSchemePress = async () => {
        await setUserColorScheme(colorScheme);
    };

    return (
        <TouchableOpacity
            onPress={handleSchemePress}
            style={applyStyle(pickerItemWrapperStyle, { isColorSchemeActive })}
        >
            <Box flexDirection="row" justifyContent="center">
                <Box
                    style={applyStyle(pickerItemDotStyle, {
                        backgroundColor: colorVariants[colorVariant].backgroundSurfaceElevation0,
                        isFirstItem: true,
                    })}
                />
                <Box
                    style={applyStyle(pickerItemDotStyle, {
                        backgroundColor: colorVariants[colorVariant].backgroundNeutralSubdued,
                        isFirstItem: false,
                    })}
                />
                <Box
                    style={applyStyle(pickerItemDotStyle, {
                        backgroundColor: colorVariants[colorVariant].backgroundNeutralBold,
                        isFirstItem: false,
                    })}
                />
            </Box>
            <Text
                style={applyStyle(textStyle)}
                color={isColorSchemeActive ? 'textSecondaryHighlight' : 'textSubdued'}
            >
                {colorScheme}
            </Text>
        </TouchableOpacity>
    );
};
