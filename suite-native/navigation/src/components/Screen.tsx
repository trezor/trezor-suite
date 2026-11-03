import { type ReactNode, useState } from 'react';
import { type LayoutChangeEvent, type ScrollViewProps, View, type ViewProps } from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { type EdgeInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import { useRoute } from '@react-navigation/native';
import { type RequireOneOrNone } from 'type-fest';

import { selectIsAnyBannerMessageActive } from '@suite-common/message-system';
import {
    Box,
    ScreenTopEdgeFade,
    isLiquidGlassAvailable,
    useBannerAwareSafeAreaInsets,
} from '@suite-native/atoms';
import { KeyboardToolbar, KeyboardToolbarHost } from '@suite-native/keyboard';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type Color, type NativeSpacing } from '@trezor/theme';

import { useAndroidNavigationBarStyle } from '../hooks/useAndroidNavigationBarStyle';
import { useFloatingTabBarHeight } from '../hooks/useFloatingTabBarHeight';
import { useIsBottomInsetApplicable } from '../hooks/useIsBottomInsetApplicable';
import { type DynamicScreenHeaderProps } from './DynamicHeader/DynamicScreenHeader';
import { DynamicHeaderProvider } from './DynamicHeader/DynamicScreenHeaderContext';
import { DynamicScrollableScreenContentHeader } from './DynamicHeader/DynamicScrollableScreenContentHeader';
import { isScreenHeaderPropDynamic } from './DynamicHeader/dynamicHeaderUtils';
import { ScreenContentWrapper } from './ScreenContentWrapper';

export type ScreenProps = {
    children: ReactNode;
    header?: ReactNode;
    footer?: ReactNode;
    footerHorizontalPadding?: NativeSpacing;
    keyboardToolbarComponent?: ReactNode;
    keyboardToolbarHostName?: string;
    systemThemeStyle?: 'dark' | 'light';
    isScrollable?: boolean;
    backgroundColor?: Color;
    noHorizontalPadding?: boolean;
    noBottomPadding?: boolean;
    focusedInputBottomOffset?: number;
    isFooterKeyboardAware?: boolean;
    hasBottomInset?: boolean;
    /**
     * Lets scrollable content pass under the header, so its Liquid Glass surfaces show through.
     * Only applies where Liquid Glass is available, elsewhere the header stays above the content.
     */
    isHeaderFloating?: boolean;
    refreshControl?: ScrollViewProps['refreshControl'];
    containerStyle?: ViewProps['style'];
} & RequireOneOrNone<{
    keyboardToolbarComponent?: ReactNode;
    keyboardToolbarHostName?: string;
}>;

const getScreenTopPadding = (insets: EdgeInsets, isMessageBannerDisplayed: boolean, sp8: number) =>
    // If the message banner is displayed, the app content is rendered right under the banner.
    isMessageBannerDisplayed ? 0 : Math.max(insets.top, sp8);

const screenContainerStyle = prepareNativeStyle<{
    backgroundColor: Color;
    insets: EdgeInsets;
    isMessageBannerDisplayed: boolean;
    isHeaderFloating: boolean;
}>((utils, { backgroundColor, insets, isMessageBannerDisplayed, isHeaderFloating }) => ({
    flex: 1,
    backgroundColor: utils.colors[backgroundColor],
    // A floating header lets the content scroll up under the status bar, softened by a top fade.
    paddingTop: isHeaderFloating
        ? 0
        : getScreenTopPadding(insets, isMessageBannerDisplayed, utils.spacings.sp8),
}));

const floatingHeaderStyle = prepareNativeStyle<{
    insets: EdgeInsets;
    isMessageBannerDisplayed: boolean;
}>((utils, { insets, isMessageBannerDisplayed }) => ({
    position: 'absolute',
    top: getScreenTopPadding(insets, isMessageBannerDisplayed, utils.spacings.sp8),
    left: 0,
    right: 0,
}));

const screenContentStyle = prepareNativeStyle<{
    insets: EdgeInsets;
    horizontalPadding: number;
    applyBottomInset: boolean;
    bottomPadding: number;
    floatingTabBarHeight: number;
    floatingHeaderPadding: number;
}>(
    (
        _,
        {
            insets,
            horizontalPadding,
            applyBottomInset,
            bottomPadding,
            floatingTabBarHeight,
            floatingHeaderPadding,
        },
    ) => {
        const { left, right, bottom } = insets;
        const bottomInset = applyBottomInset ? bottom : 0;

        return {
            flexGrow: 1,
            paddingTop: floatingHeaderPadding,
            paddingLeft: left + horizontalPadding,
            paddingRight: right + horizontalPadding,
            paddingBottom: bottomInset + bottomPadding + floatingTabBarHeight,
        };
    },
);

const screenFooterStyle = prepareNativeStyle<{
    insets: EdgeInsets;
    applyBottomInset: boolean;
    horizontalPadding: number;
    floatingTabBarHeight: number;
}>((_, { insets, applyBottomInset, horizontalPadding, floatingTabBarHeight }) => ({
    paddingBottom: (applyBottomInset ? insets.bottom : 0) + floatingTabBarHeight,
    paddingLeft: insets.left + horizontalPadding,
    paddingRight: insets.right + horizontalPadding,
}));

export const Screen = ({
    children,
    header,
    footer,
    footerHorizontalPadding,
    keyboardToolbarComponent,
    keyboardToolbarHostName,
    refreshControl,
    containerStyle,
    systemThemeStyle,
    isScrollable = true,
    backgroundColor = 'surfaceFillPage',
    noHorizontalPadding = false,
    noBottomPadding = false,
    focusedInputBottomOffset,
    isFooterKeyboardAware = true,
    hasBottomInset = true,
    isHeaderFloating = false,
}: ScreenProps) => {
    const [keyboardToolbarHeight, setKeyboardToolbarHeight] = useState(0);
    const [floatingHeaderHeight, setFloatingHeaderHeight] = useState(0);
    const {
        applyStyle,
        utils: { spacings },
    } = useNativeStyles();

    const insets = useBannerAwareSafeAreaInsets();
    const isBottomInsetApplicable = useIsBottomInsetApplicable();
    const floatingTabBarHeight = useFloatingTabBarHeight();
    const activeKeyboardToolbarHeight = keyboardToolbarComponent ? keyboardToolbarHeight : 0;

    const horizontalPadding = noHorizontalPadding ? 0 : spacings.sp16;
    const bottomPadding = noBottomPadding ? 0 : spacings.sp16;
    const applyBottomInset = isBottomInsetApplicable && hasBottomInset;
    // Non-scrollable screens render their own lists, which handle the tab bar overlap themselves.
    const contentFloatingTabBarHeight = isScrollable && !footer ? floatingTabBarHeight : 0;
    const systemBarsStyle = useAndroidNavigationBarStyle({ backgroundColor });

    const isMessageBannerDisplayed = useSelector(selectIsAnyBannerMessageActive);

    const { name } = useRoute();

    // We have to extract dynamic header props from header prop. While not ideal, this allows us to only send one header prop to the screen.
    const dynamicHeaderProps = ((): DynamicScreenHeaderProps | null => {
        if (isScreenHeaderPropDynamic(header)) {
            return header.props;
        }

        return null;
    })();

    const shouldRenderDynamicScrollableHeader =
        isScreenHeaderPropDynamic(header) && !dynamicHeaderProps?.isCompactOnly;

    const isHeaderFloatingApplied =
        isHeaderFloating &&
        isLiquidGlassAvailable &&
        isScrollable &&
        !!header &&
        !isScreenHeaderPropDynamic(header);
    const screenTopPadding = getScreenTopPadding(insets, isMessageBannerDisplayed, spacings.sp8);
    const contentFloatingHeaderHeight = isHeaderFloatingApplied
        ? screenTopPadding + floatingHeaderHeight
        : 0;

    // The pull-to-refresh spinner is placed relative to the content inset, not its padding. With a
    // refresh control, the space under the floating header is therefore a content inset, so the
    // spinner settles below the header instead of behind it.
    const isFloatingHeaderSpaceInset = !!refreshControl && contentFloatingHeaderHeight > 0;

    const handleFloatingHeaderLayout = (event: LayoutChangeEvent) => {
        setFloatingHeaderHeight(event.nativeEvent.layout.height);
    };

    return (
        <DynamicHeaderProvider scrollThreshold={dynamicHeaderProps?.scrollThreshold}>
            <View
                accessible
                style={[
                    applyStyle(screenContainerStyle, {
                        backgroundColor,
                        insets,
                        isMessageBannerDisplayed,
                        isHeaderFloating: isHeaderFloatingApplied,
                    }),
                    containerStyle,
                ]}
                testID={`@screen/${name}`}
            >
                <SystemBars style={systemThemeStyle ?? systemBarsStyle} />
                {!isHeaderFloatingApplied && header}
                <ScreenContentWrapper
                    isScrollable={isScrollable}
                    // The floating header is separated from the content by its glass, not a divider.
                    hasHeader={!!header && !isHeaderFloatingApplied}
                    scrollIndicatorTopInset={contentFloatingHeaderHeight}
                    contentInsetTop={isFloatingHeaderSpaceInset ? contentFloatingHeaderHeight : 0}
                    scrollIndicatorBottomInset={
                        (applyBottomInset && !footer ? insets.bottom : 0) +
                        contentFloatingTabBarHeight
                    }
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
                            floatingTabBarHeight: contentFloatingTabBarHeight,
                            floatingHeaderPadding: isFloatingHeaderSpaceInset
                                ? 0
                                : contentFloatingHeaderHeight,
                        })}
                    >
                        {children}
                    </Box>
                </ScreenContentWrapper>
                {isHeaderFloatingApplied && (
                    <ScreenTopEdgeFade
                        solidHeight={screenTopPadding}
                        fadeHeight={floatingHeaderHeight}
                        backgroundColor={backgroundColor}
                    />
                )}
                {isHeaderFloatingApplied && (
                    <View
                        onLayout={handleFloatingHeaderLayout}
                        style={applyStyle(floatingHeaderStyle, {
                            insets,
                            isMessageBannerDisplayed,
                        })}
                    >
                        {header}
                    </View>
                )}
                {footer && (
                    <KeyboardStickyView
                        enabled={isFooterKeyboardAware}
                        offset={{ opened: -activeKeyboardToolbarHeight }}
                        style={applyStyle(screenFooterStyle, {
                            insets,
                            applyBottomInset,
                            horizontalPadding: footerHorizontalPadding
                                ? spacings[footerHorizontalPadding]
                                : 0,
                            floatingTabBarHeight,
                        })}
                    >
                        {footer}
                    </KeyboardStickyView>
                )}
                {!!keyboardToolbarComponent && !keyboardToolbarHostName && (
                    <KeyboardToolbar onHeightChange={setKeyboardToolbarHeight}>
                        {keyboardToolbarComponent}
                    </KeyboardToolbar>
                )}
                {keyboardToolbarHostName !== undefined && !keyboardToolbarComponent && (
                    <KeyboardToolbarHost name={keyboardToolbarHostName} />
                )}
            </View>
        </DynamicHeaderProvider>
    );
};
