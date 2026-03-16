import { type PropsWithChildren } from 'react';
import { GestureDetector, type GestureType } from 'react-native-gesture-handler';
import {
    FadeIn,
    FadeOut,
    LinearTransition,
    type SharedValue,
    interpolate,
    useAnimatedStyle,
} from 'react-native-reanimated';

import { LinearGradient } from 'expo-linear-gradient';

import { AnimatedBox, useBannerAwareSafeAreaInsets } from '@suite-native/atoms';
import { Screen, type ScreenHeaderProps } from '@suite-native/navigation';
import { useActiveColorScheme } from '@suite-native/theme';
import { getScreenWidth, getWindowWidth } from '@trezor/env-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { type ThemeColorVariant } from '@trezor/theme';

import { type BottomSheetControlProps } from '../hooks/useConfirmOnTrezorSheet';

const SCREEN_WIDTH = getScreenWidth();
const WINDOW_WIDTH = getWindowWidth();

const gradientStyle = prepareNativeStyle(() => ({
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 1000,
    pointerEvents: 'none',
}));

const contentContainerStyle = prepareNativeStyle<{ colorVariant: ThemeColorVariant }>(
    (utils, { colorVariant }) => ({
        flex: 1,
        backgroundColor: utils.colors.backgroundSurfaceElevation0,
        borderWidth: utils.borders.widths.small,
        width: SCREEN_WIDTH + utils.borders.widths.small * 2,
        borderColor: colorVariant === 'dark' ? utils.colors.borderOnElevation1 : 'transparent',
        position: 'absolute',
        top: 0,
        bottom: 0,
        alignSelf: 'center',
    }),
);

const innerContainerStyle = prepareNativeStyle(() => ({
    paddingTop: 0,
}));

const indicatorStyle = prepareNativeStyle<{ colorVariant: ThemeColorVariant }>(
    (_, { colorVariant }) => ({
        alignSelf: 'center',
        width: (10 * WINDOW_WIDTH) / 100,
        height: 6,
        borderRadius: 4,
        backgroundColor:
            colorVariant === 'dark' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)',
    }),
);

export type ConfirmOnTrezorWrapperProps = PropsWithChildren<{
    controlRef?: React.Ref<BottomSheetControlProps>;
    isManualControlEnabled?: boolean;
    defaultHeader?: React.ReactNode;
    isCloseButtonDisabled?: boolean;
}> &
    ScreenHeaderProps;

type ConfirmOnTrezorContentProps = ConfirmOnTrezorWrapperProps & {
    translateY: SharedValue<number>;
    snapPoints: number[];
    isFullscreen: boolean;
    panGesture: GestureType;
};

export const ConfirmOnTrezorContent = ({
    translateY,
    snapPoints,
    isFullscreen,
    panGesture,
    children,
    defaultHeader,
}: ConfirmOnTrezorContentProps) => {
    const { applyStyle, utils } = useNativeStyles();
    const colorVariant = useActiveColorScheme();

    const insets = useBannerAwareSafeAreaInsets();

    const gradientColor = utils.colors.backgroundSurfaceElevation0;

    const animatedSheetStyle = useAnimatedStyle(() => {
        const paddingTop = interpolate(
            translateY.value,
            [snapPoints[2], snapPoints[1], snapPoints[0]],
            [insets.top, 0, 0],
        );

        const borderRadius = interpolate(
            translateY.value,
            [snapPoints[2], snapPoints[1], snapPoints[0]],
            [0, utils.borders.radii.r16, utils.borders.radii.r16],
        );

        return {
            transform: [{ translateY: translateY.value }],
            paddingTop,
            borderTopLeftRadius: borderRadius,
            borderTopRightRadius: borderRadius,
        };
    });

    const animatedHandleStyle = useAnimatedStyle(() => ({
        opacity: interpolate(
            translateY.value,
            [snapPoints[2], snapPoints[1], snapPoints[0]],
            [0, 1, 1],
        ),
        padding: interpolate(
            translateY.value,
            [snapPoints[2], snapPoints[1], snapPoints[0]],
            [0, utils.spacings.sp16, utils.spacings.sp16],
        ),
    }));

    const animatedIndicatorStyle = useAnimatedStyle(() => ({
        height: interpolate(
            translateY.value,
            [snapPoints[2], snapPoints[1], snapPoints[0]],
            [0, 4, 4],
        ),
    }));

    const animatedGradientStyle = useAnimatedStyle(() => ({
        opacity: interpolate(translateY.value, [snapPoints[1], snapPoints[0]], [0, 1]),
    }));

    return (
        <>
            <AnimatedBox style={[applyStyle(gradientStyle), animatedGradientStyle]} flex={1}>
                <LinearGradient
                    style={applyStyle(gradientStyle)}
                    colors={[`${gradientColor}00`, gradientColor]}
                    locations={[0, 1]}
                />
            </AnimatedBox>
            <GestureDetector gesture={panGesture}>
                <AnimatedBox
                    flex={1}
                    style={[
                        applyStyle(contentContainerStyle, { colorVariant }),
                        animatedSheetStyle,
                    ]}
                    layout={LinearTransition}
                >
                    <AnimatedBox style={animatedHandleStyle}>
                        <AnimatedBox
                            style={[
                                applyStyle(indicatorStyle, { colorVariant }),
                                animatedIndicatorStyle,
                            ]}
                        />
                    </AnimatedBox>
                    {isFullscreen && (
                        <AnimatedBox exiting={FadeOut} entering={FadeIn}>
                            {defaultHeader}
                        </AnimatedBox>
                    )}
                    <Screen
                        systemThemeStyle={!isFullscreen ? 'light' : undefined}
                        containerStyle={applyStyle(innerContainerStyle)}
                    >
                        {children}
                    </Screen>
                </AnimatedBox>
            </GestureDetector>
        </>
    );
};
