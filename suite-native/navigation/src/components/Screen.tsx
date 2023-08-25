import React, { ReactNode, useEffect, useContext } from 'react';
import { Platform, StatusBar, View } from 'react-native';
import { useSafeAreaInsets, EdgeInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import * as SystemUI from 'expo-system-ui';
import * as NavigationBar from 'expo-navigation-bar';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Color, nativeSpacings } from '@trezor/theme';
import { Box, Divider } from '@suite-native/atoms';
import { selectIsAnyBannerMessageActive } from '@suite-common/message-system';

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
    isMessageBannerDisplayed: boolean;
}>(
    (
        utils,
        {
            backgroundColor,
            customVerticalPadding,
            insets,
            isTabBarVisible,
            isMessageBannerDisplayed,
        },
    ) => ({
        flex: 1,
        backgroundColor: utils.colors[backgroundColor],
        paddingTop: Math.max(insets.top, customVerticalPadding),
        extend: [
            {
                condition: !isTabBarVisible,
                style: {
                    paddingBottom: Math.max(insets.bottom, customVerticalPadding),
                },
            },
            {
                // If the message banner is displayed, the top padding has to be equal to 0
                // to render the app content right under the banner.
                condition: isMessageBannerDisplayed,
                style: {
                    paddingTop: 0,
                },
            },
        ],
    }),
);

const screenHeaderStyle = prepareNativeStyle<{
    insets: EdgeInsets;
    customHorizontalPadding: number;
}>((utils, { insets, customHorizontalPadding }) => ({
    paddingLeft: Math.max(insets.left, customHorizontalPadding),
    paddingRight: Math.max(insets.right, customHorizontalPadding),
    paddingTop: utils.spacings.large,
    paddingBottom: utils.spacings.extraLarge,
}));

export const Screen = ({
    children,
    header,
    footer,
    hasDivider = false,
    isScrollable = true,
    hasStatusBar = true,
    backgroundColor = 'backgroundSurfaceElevation0',
    customVerticalPadding = nativeSpacings.small,
    customHorizontalPadding = nativeSpacings.small,
}: ScreenProps) => {
    const {
        applyStyle,
        utils: { colors, isDarkColor },
    } = useNativeStyles();

    const isTabBarVisible = !!useContext(BottomTabBarHeightContext);
    const insets = useSafeAreaInsets();
    const backgroundCSSColor = colors[backgroundColor];
    const barStyle = isDarkColor(backgroundCSSColor) ? 'light-content' : 'dark-content';

    const isMessageBannerDisplayed = useSelector(selectIsAnyBannerMessageActive);

    useEffect(() => {
        // this prevents some weird flashing of splash screen on Android during screen transitions
        SystemUI.setBackgroundColorAsync(backgroundCSSColor);

        if (Platform.OS === 'android') {
            NavigationBar.setBackgroundColorAsync(backgroundCSSColor);
            NavigationBar.setButtonStyleAsync(isDarkColor(backgroundCSSColor) ? 'light' : 'dark');
        }
    }, [backgroundCSSColor, isDarkColor]);

    return (
        <View
            style={applyStyle(screenContainerStyle, {
                backgroundColor,
                customVerticalPadding,
                insets,
                isTabBarVisible,
                isMessageBannerDisplayed,
            })}
        >
            <StatusBar
                barStyle={barStyle}
                hidden={!hasStatusBar}
                translucent={false}
                backgroundColor={backgroundCSSColor}
            />
            {header && (
                <>
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
                </>
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
