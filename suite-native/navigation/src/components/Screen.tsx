import { ReactNode, useContext } from 'react';
import { ScrollViewProps, View } from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';
import { EdgeInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { useRoute } from '@react-navigation/native';

import { selectIsAnyBannerMessageActive } from '@suite-common/message-system';
import { Box, useBannerAwareSafeAreaInsets } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Color } from '@trezor/theme';

import { ScreenContentWrapper } from './ScreenContentWrapper';
import { useAndroidNavigationBarStyle } from '../hooks/useAndroidNavigationBarStyle';

type ScreenProps = {
    children: ReactNode;
    header?: ReactNode;
    footer?: ReactNode;
    isScrollable?: boolean;
    backgroundColor?: Color;
    noHorizontalPadding?: boolean;
    noBottomPadding?: boolean;
    extraKeyboardAvoidingViewHeight?: number;
    hasBottomInset?: boolean;
    refreshControl?: ScrollViewProps['refreshControl'];
    keyboardDismissMode?: ScrollViewProps['keyboardDismissMode'];
};

const screenContainerStyle = prepareNativeStyle<{
    backgroundColor: Color;
    insets: EdgeInsets;
    bottomPadding: number;
    hasBottomPadding: boolean;
    isMessageBannerDisplayed: boolean;
}>(
    (
        utils,
        { backgroundColor, bottomPadding, insets, hasBottomPadding, isMessageBannerDisplayed },
    ) => ({
        flex: 1,
        backgroundColor: utils.colors[backgroundColor],
        paddingTop: Math.max(insets.top, utils.spacings.sp8),
        extend: [
            {
                condition: hasBottomPadding,
                style: {
                    paddingBottom: Math.max(insets.bottom, bottomPadding),
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
    horizontalPadding: number;
    bottomPadding: number;
    isScrollable: boolean;
}>((_, { horizontalPadding, bottomPadding, insets, isScrollable }) => {
    const { left, right } = insets;

    return {
        flexGrow: 1,
        paddingLeft: Math.max(left, horizontalPadding),
        paddingRight: Math.max(right, horizontalPadding),

        extend: {
            // Scrollable screen takes the whole height of the screen. This padding is needed to
            // prevent the content being "sticked" to the bottom navbar.
            condition: isScrollable,
            style: {
                paddingBottom: bottomPadding,
            },
        },
    };
});

export const Screen = ({
    children,
    header,
    footer,
    refreshControl,
    keyboardDismissMode,
    isScrollable = true,
    backgroundColor = 'backgroundSurfaceElevation0',
    noHorizontalPadding = false,
    noBottomPadding = false,
    extraKeyboardAvoidingViewHeight = 0,
    hasBottomInset = true,
}: ScreenProps) => {
    const {
        applyStyle,
        utils: { spacings },
    } = useNativeStyles();

    const insets = useBannerAwareSafeAreaInsets();
    const horizontalPadding = noHorizontalPadding ? 0 : spacings.sp16;
    const bottomPadding = noBottomPadding ? 0 : spacings.sp16;
    const hasBottomPadding = !useContext(BottomTabBarHeightContext) && hasBottomInset;
    const systemBarsStyle = useAndroidNavigationBarStyle({ backgroundColor });

    const isMessageBannerDisplayed = useSelector(selectIsAnyBannerMessageActive);

    const { name } = useRoute();

    return (
        <View
            style={applyStyle(screenContainerStyle, {
                backgroundColor,
                insets,
                bottomPadding,
                hasBottomPadding,
                isMessageBannerDisplayed,
            })}
            testID={`@screen/${name}`}
        >
            <SystemBars style={systemBarsStyle} />
            {header}
            <ScreenContentWrapper
                isScrollable={isScrollable}
                hasHeader={!!header}
                extraKeyboardAvoidingViewHeight={extraKeyboardAvoidingViewHeight}
                refreshControl={refreshControl}
                keyboardDismissMode={keyboardDismissMode}
            >
                <Box
                    style={applyStyle(screenContentBaseStyle, {
                        insets,
                        horizontalPadding,
                        bottomPadding,
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
