import React, { ReactNode, useEffect, useContext } from 'react';
import { StatusBar, View } from 'react-native';
import { useSafeAreaInsets, EdgeInsets } from 'react-native-safe-area-context';

import * as SystemUI from 'expo-system-ui';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Color, nativeSpacings } from '@trezor/theme';
import { Box, Divider } from '@suite-native/atoms';

import { ScreenContent } from './ScreenContent';

type ScreenProps = {
    children: ReactNode;
    header?: ReactNode;
    footer?: ReactNode;
    hasDivider?: boolean;
    hasStatusBar?: boolean;
    isScrollable?: boolean;
    backgroundColor?: Color;
    customVerticalPadding?: number;
    customHorizontalPadding?: number;
};

const screenContainerStyle = prepareNativeStyle<{
    backgroundColor: Color;
    insets: EdgeInsets;
    customVerticalPadding: number;
    isTabBarVisible: boolean;
}>((utils, { backgroundColor, customVerticalPadding, insets, isTabBarVisible }) => ({
    flex: 1,
    backgroundColor: utils.colors[backgroundColor],
    paddingTop: Math.max(insets.top, customVerticalPadding),
    extend: {
        condition: !isTabBarVisible,
        style: {
            paddingBottom: Math.max(insets.bottom, customVerticalPadding),
        },
    },
}));

const screenHeaderStyle = prepareNativeStyle<{
    insets: EdgeInsets;
    customHorizontalPadding: number;
}>((_, { insets, customHorizontalPadding }) => ({
    paddingLeft: Math.max(insets.left, customHorizontalPadding),
    paddingRight: Math.max(insets.right, customHorizontalPadding),
}));

export const Screen = ({
    children,
    header,
    footer,
    hasDivider = false,
    isScrollable = true,
    hasStatusBar = true,
    backgroundColor = 'backgroundSurfaceElevation0',
    customVerticalPadding = nativeSpacings.medium,
    customHorizontalPadding = nativeSpacings.medium,
}: ScreenProps) => {
    const {
        applyStyle,
        utils: { colors, isDarkColor },
    } = useNativeStyles();

    const isTabBarVisible = !!useContext(BottomTabBarHeightContext);
    const insets = useSafeAreaInsets();
    const backgroundCSSColor = colors[backgroundColor];
    const barStyle = isDarkColor(backgroundCSSColor) ? 'light-content' : 'dark-content';

    useEffect(() => {
        // this prevents some weird flashing of splash screen on Android during screen transitions
        SystemUI.setBackgroundColorAsync(backgroundCSSColor);
    }, [backgroundCSSColor]);

    return (
        <View
            style={applyStyle(screenContainerStyle, {
                backgroundColor,
                customVerticalPadding,
                insets,
                isTabBarVisible,
            })}
        >
            <StatusBar
                barStyle={barStyle}
                hidden={!hasStatusBar}
                translucent={false}
                backgroundColor={backgroundCSSColor}
            />
            {header && (
                <View>
                    <View
                        style={[
                            applyStyle(screenHeaderStyle, {
                                insets,
                                customHorizontalPadding,
                            }),
                        ]}
                    >
                        {header}
                    </View>
                    {hasDivider && (
                        <Box marginTop="small">
                            <Divider />
                        </Box>
                    )}
                </View>
            )}
            <ScreenContent
                footer={footer}
                isScrollable={isScrollable}
                customVerticalPadding={customVerticalPadding}
                customHorizontalPadding={customHorizontalPadding}
            >
                {children}
            </ScreenContent>
        </View>
    );
};
