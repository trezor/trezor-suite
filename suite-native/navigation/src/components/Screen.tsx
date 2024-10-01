import { useEffect, useContext, ReactNode } from 'react';
import { Platform, ScrollViewProps, StatusBar, View } from 'react-native';
import { EdgeInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import * as SystemUI from 'expo-system-ui';
import * as NavigationBar from 'expo-navigation-bar';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { useRoute } from '@react-navigation/native';

import { useOfflineBannerAwareSafeAreaInsets } from '@suite-native/connection-status';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Color, nativeSpacings } from '@trezor/theme';
import { selectIsAnyBannerMessageActive } from '@suite-common/message-system';
import { Box } from '@suite-native/atoms';

import { ScreenContentWrapper } from './ScreenContentWrapper';

type ScreenProps = {
    children: ReactNode;
    footer?: ReactNode;
    subheader?: ReactNode;
    screenHeader?: ReactNode;
    hasStatusBar?: boolean;
    isScrollable?: boolean;
    backgroundColor?: Color;
    customVerticalPadding?: number;
    customHorizontalPadding?: number;
    extraKeyboardAvoidingViewHeight?: number;
    hasBottomInset?: boolean;
    refreshControl?: ScrollViewProps['refreshControl'];
    keyboardDismissMode?: ScrollViewProps['keyboardDismissMode'];
};

const screenContainerStyle = prepareNativeStyle<{
    backgroundColor: Color;
    insets: EdgeInsets;
    customVerticalPadding: number;
    hasPaddingBottom: boolean;
    isMessageBannerDisplayed: boolean;
}>(
    (
        utils,
        {
            backgroundColor,
            customVerticalPadding,
            insets,
            hasPaddingBottom,
            isMessageBannerDisplayed,
        },
    ) => ({
        flex: 1,
        backgroundColor: utils.colors[backgroundColor],
        paddingTop: Math.max(insets.top, customVerticalPadding),
        extend: [
            {
                condition: hasPaddingBottom,
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

const screenContentBaseStyle = prepareNativeStyle<{
    insets: EdgeInsets;
    customHorizontalPadding: number;
    customVerticalPadding: number;
    isScrollable: boolean;
}>((_, { customHorizontalPadding, customVerticalPadding, insets, isScrollable }) => {
    const { left, right } = insets;

    return {
        flexGrow: 1,
        paddingTop: customVerticalPadding,
        paddingLeft: Math.max(left, customHorizontalPadding),
        paddingRight: Math.max(right, customHorizontalPadding),

        extend: {
            // Scrollable screen takes the whole height of the screen. This padding is needed to
            // prevent the content being "sticked" to the bottom navbar.
            condition: isScrollable,
            style: {
                paddingBottom: customVerticalPadding,
            },
        },
    };
});

export const Screen = ({
    children,
    footer,
    screenHeader,
    subheader,
    refreshControl,
    keyboardDismissMode,
    isScrollable = true,
    hasStatusBar = true,
    backgroundColor = 'backgroundSurfaceElevation0',
    customVerticalPadding = nativeSpacings.sp8,
    customHorizontalPadding = nativeSpacings.sp8,
    extraKeyboardAvoidingViewHeight = 0,
    hasBottomInset = true,
}: ScreenProps) => {
    const {
        applyStyle,
        utils: { colors, isDarkColor },
    } = useNativeStyles();

    const hasPaddingBottom = !useContext(BottomTabBarHeightContext) && hasBottomInset;
    const insets = useOfflineBannerAwareSafeAreaInsets();
    const backgroundCSSColor = colors[backgroundColor];
    const barStyle = isDarkColor(backgroundCSSColor) ? 'light-content' : 'dark-content';

    const isMessageBannerDisplayed = useSelector(selectIsAnyBannerMessageActive);

    const { name } = useRoute();

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
                hasPaddingBottom,
                isMessageBannerDisplayed,
            })}
            testID={`@screen/${name}`}
        >
            <StatusBar
                barStyle={barStyle}
                hidden={!hasStatusBar}
                translucent={false}
                backgroundColor={backgroundCSSColor}
            />
            {screenHeader}
            <ScreenContentWrapper
                isScrollable={isScrollable}
                extraKeyboardAvoidingViewHeight={extraKeyboardAvoidingViewHeight}
                refreshControl={refreshControl}
                keyboardDismissMode={keyboardDismissMode}
            >
                {subheader}
                <Box
                    style={applyStyle(screenContentBaseStyle, {
                        insets,
                        customHorizontalPadding,
                        customVerticalPadding,
                        isScrollable,
                    })}
                >
                    {children}
                </Box>
            </ScreenContentWrapper>
            {footer}
        </View>
    );
};
