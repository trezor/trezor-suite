import { Box, PressableOpacity, Text } from '@suite-native/atoms';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { type AppColorScheme, useSystemColorScheme, useUserColorScheme } from '@suite-native/theme';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type CSSColor, colorVariants } from '@trezor/theme';

type ColorSchemePickerItemProps = {
    colorScheme: AppColorScheme;
    translationId: TxKeyPath;
};

const pickerItemWrapperStyle = prepareNativeStyle<{ isColorSchemeActive: boolean }>(
    (utils, { isColorSchemeActive }) => ({
        backgroundColor: utils.colors.backgroundSurfaceElevationNegative,
        borderRadius: utils.borders.radii.r16,
        minHeight: 114,
        flex: 1,
        paddingTop: 33,
        borderWidth: utils.borders.widths.medium,
        borderColor: isColorSchemeActive
            ? utils.colors.borderSecondary
            : utils.colors.borderElevation1,
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
                marginLeft: utils.negative(utils.spacings.sp8),
            },
        },
    }),
);

const textStyle = prepareNativeStyle(utils => ({
    alignSelf: 'center',
    textAlign: 'center',
    paddingTop: 23,
    paddingBottom: utils.spacings.sp8,
    paddingHorizontal: utils.spacings.sp8,
}));

export const ColorSchemePickerItem = ({
    colorScheme,
    translationId,
}: ColorSchemePickerItemProps) => {
    const { applyStyle } = useNativeStyles();

    const { userColorScheme, setUserColorScheme } = useUserColorScheme();
    const isColorSchemeActive = colorScheme === userColorScheme;
    const systemColorScheme = useSystemColorScheme();

    const colorVariant = colorScheme === 'system' ? systemColorScheme : colorScheme;

    const handleSchemePress = async () => {
        await setUserColorScheme(colorScheme);
    };

    return (
        <PressableOpacity
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
                <Translation id={translationId} />
            </Text>
        </PressableOpacity>
    );
};
