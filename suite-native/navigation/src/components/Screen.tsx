import { type ReactNode, useContext } from 'react';
import { type ScrollViewProps, View, type ViewProps } from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { type EdgeInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { useRoute } from '@react-navigation/native';

import { selectIsAnyBannerMessageActive } from '@suite-common/message-system';
import { Box, useBannerAwareSafeAreaInsets } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type Color } from '@trezor/theme';

import { type DynamicScreenHeaderProps } from './DynamicHeader/DynamicScreenHeader';
import { DynamicHeaderProvider } from './DynamicHeader/DynamicScreenHeaderContext';
import { ScreenContentWrapper } from './ScreenContentWrapper';
import { useAndroidNavigationBarStyle } from '../hooks/useAndroidNavigationBarStyle';
import { useIsKeyboardShown } from '../hooks/useIsKeyboardShown';
import { DynamicScrollableScreenContentHeader } from './DynamicHeader/DynamicScrollableScreenContentHeader';
import { isScreenHeaderPropDynamic } from './DynamicHeader/dynamicHeaderUtils';

export type ScreenProps = {
    children: ReactNode;
    header?: ReactNode;
    footer?: ReactNode;
    systemThemeStyle?: 'dark' | 'light';
    isScrollable?: boolean;
    backgroundColor?: Color;
    noHorizontalPadding?: boolean;
    noBottomPadding?: boolean;
    focusedInputBottomOffset?: number;
    hasBottomInset?: boolean;
    refreshControl?: ScrollViewProps['refreshControl'];
    containerStyle?: ViewProps['style'];
};

const screenContainerStyle = prepareNativeStyle<{
    backgroundColor: Color;
    insets: EdgeInsets;
    isMessageBannerDisplayed: boolean;
}>((utils, { backgroundColor, insets, isMessageBannerDisplayed }) => ({
    flex: 1,
    backgroundColor: utils.colors[backgroundColor],
    paddingTop: Math.max(insets.top, utils.spacings.sp8),
    extend: [
        {
            // If the message banner is displayed, the top padding has to be equal to 0
            // to render the app content right under the banner.
            condition: isMessageBannerDisplayed,
            style: {
                paddingTop: 0,
            },
        },
    ],
}));

const screenContentStyle = prepareNativeStyle<{
    insets: EdgeInsets;
    horizontalPadding: number;
    applyBottomInset: boolean;
    bottomPadding: number;
}>((_, { insets, horizontalPadding, applyBottomInset, bottomPadding }) => {
    const { left, right, bottom } = insets;
    const bottomInset = applyBottomInset ? bottom : 0;

    return {
        flexGrow: 1,
        paddingLeft: Math.max(left, horizontalPadding),
        paddingRight: Math.max(right, horizontalPadding),
        paddingBottom: bottomInset + bottomPadding,
    };
});

const screenFooterStyle = prepareNativeStyle<{
    insets: EdgeInsets;
    applyBottomInset: boolean;
}>((_, { insets, applyBottomInset }) => ({
    paddingBottom: applyBottomInset ? insets.bottom : 0,
}));

export const Screen = ({
    children,
    header,
    footer,
    refreshControl,
    containerStyle,
    systemThemeStyle,
    isScrollable = true,
    backgroundColor = 'backgroundSurfaceElevation0',
    noHorizontalPadding = false,
    noBottomPadding = false,
    focusedInputBottomOffset,
    hasBottomInset = true,
}: ScreenProps) => {
    const {
        applyStyle,
        utils: { spacings },
    } = useNativeStyles();

    const insets = useBannerAwareSafeAreaInsets();
    const isKeyboardShown = useIsKeyboardShown();

    const horizontalPadding = noHorizontalPadding ? 0 : spacings.sp16;
    const bottomPadding = noBottomPadding ? 0 : spacings.sp16;
    const applyBottomInset =
        !useContext(BottomTabBarHeightContext) && hasBottomInset && !isKeyboardShown;
    const systemBarsStyle = useAndroidNavigationBarStyle({ backgroundColor });

    const isMessageBannerDisplayed = useSelector(selectIsAnyBannerMessageActive);

    const { name } = useRoute();

    // We have to extract dynamic header props from header prop. While not ideal, this allows us to only send one header prop to the screen.
    const dynamicHeaderProps = ((): DynamicScreenHeaderProps | null => {
        if (isScreenHeaderPropDynamic(header)) {
            return header.props as DynamicScreenHeaderProps;
        }

        return null;
    })();

    const shouldRenderDynamicScrollableHeader =
        isScreenHeaderPropDynamic(header) && !dynamicHeaderProps?.isCompactOnly;

    return (
        <DynamicHeaderProvider>
            <View
                accessible
                style={[
                    applyStyle(screenContainerStyle, {
                        backgroundColor,
                        insets,
                        isMessageBannerDisplayed,
                    }),
                    containerStyle,
                ]}
                testID={`@screen/${name}`}
            >
                <SystemBars style={systemThemeStyle ?? systemBarsStyle} />
                {header}
                <ScreenContentWrapper
                    isScrollable={isScrollable}
                    hasHeader={!!header}
                    focusedInputBottomOffset={focusedInputBottomOffset}
                    refreshControl={refreshControl}
                    isDynamicHeader={isScreenHeaderPropDynamic(header)}
                >
                    {shouldRenderDynamicScrollableHeader && (
                        <DynamicScrollableScreenContentHeader {...dynamicHeaderProps} />
                    )}
                    <Box
                        style={applyStyle(screenContentStyle, {
                            insets,
                            applyBottomInset: applyBottomInset && !footer,
                            horizontalPadding,
                            bottomPadding,
                        })}
                    >
                        {children}
                    </Box>
                </ScreenContentWrapper>
                {footer && (
                    <KeyboardStickyView
                        style={applyStyle(screenFooterStyle, { insets, applyBottomInset })}
                    >
                        {footer}
                    </KeyboardStickyView>
                )}
            </View>
        </DynamicHeaderProvider>
    );
};
