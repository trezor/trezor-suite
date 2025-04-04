import { ReactNode } from 'react';
import { View } from 'react-native';
import { SharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { IconButton } from '../Button/IconButton';
import { Text } from '../Text';
import { BottomSheetGrabber } from './BottomSheetGrabber';
import { AnimatedBox, Box } from '../Box';

type BottomSheetHeaderProps = {
    title: ReactNode;
    subtitle?: ReactNode;
    isCloseDisplayed: boolean;
    onCloseSheet: () => void;
    isScrolling: SharedValue<boolean>;
};
type SheetHeaderWrapperStyleProps = { isHeaderDisplayed: boolean };

const sheetHeaderWrapperStyle = prepareNativeStyle<SheetHeaderWrapperStyleProps>(
    (utils, { isHeaderDisplayed }) => ({
        marginBottom: utils.spacings.sp24,

        extend: {
            condition: isHeaderDisplayed,
            style: {
                marginBottom: 0,
            },
        },
    }),
);

const sheetHeaderStyle = prepareNativeStyle<{ isCloseDisplayed: boolean }>(
    (utils, { isCloseDisplayed }) => ({
        flexDirection: isCloseDisplayed ? 'row' : 'column',
        justifyContent: 'space-between',
        alignItems: isCloseDisplayed ? 'center' : 'flex-start',
        paddingHorizontal: utils.spacings.sp24,
        paddingTop: utils.spacings.sp24,
        paddingBottom: utils.spacings.sp16,
    }),
);

const titlesContainer = prepareNativeStyle<{ isCloseDisplayed: boolean }>(
    (_, { isCloseDisplayed }) => ({
        maxWidth: isCloseDisplayed ? '70%' : '100%',
    }),
);

const scrollDividerStyle = prepareNativeStyle(({ borders, colors }) => ({
    marginTop: -borders.widths.small,
    borderTopWidth: borders.widths.small,
    borderTopColor: colors.borderElevation0,
}));

export const BottomSheetHeader = ({
    title,
    subtitle,
    isCloseDisplayed,
    onCloseSheet,
    isScrolling,
}: BottomSheetHeaderProps) => {
    const { applyStyle } = useNativeStyles();

    const isHeaderDisplayed = !!(title || subtitle || isCloseDisplayed);

    const dividerAnimatedStyle = useAnimatedStyle(() => ({
        opacity: withTiming(isScrolling.value ? 1 : 0, { duration: isScrolling.value ? 500 : 200 }),
    }));

    return (
        <Box
            marginVertical="sp8"
            style={applyStyle(sheetHeaderWrapperStyle, { isHeaderDisplayed })}
        >
            <BottomSheetGrabber />
            {isHeaderDisplayed && (
                <View style={applyStyle(sheetHeaderStyle, { isCloseDisplayed })}>
                    <View style={applyStyle(titlesContainer, { isCloseDisplayed })}>
                        {title && <Text variant="titleSmall">{title}</Text>}
                        {subtitle && (
                            <Text variant="label" color="textSubdued">
                                {subtitle}
                            </Text>
                        )}
                    </View>
                    {isCloseDisplayed && (
                        <IconButton
                            iconName="x"
                            onPress={onCloseSheet}
                            colorScheme="tertiaryElevation0"
                            size="medium"
                            accessibilityRole="button"
                            accessibilityLabel="Close"
                        />
                    )}
                </View>
            )}
            <AnimatedBox style={[applyStyle(scrollDividerStyle), dividerAnimatedStyle]} />
        </Box>
    );
};
