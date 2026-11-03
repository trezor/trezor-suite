import React, { type ReactNode, useEffect, useRef } from 'react';
import { type ScrollViewProps } from 'react-native';
import {
    KeyboardAwareScrollView,
    type KeyboardAwareScrollViewRef,
} from 'react-native-keyboard-controller';

import { type NativeScrollEvent } from 'react-native/Libraries/Components/ScrollView/ScrollView';
import { type NativeSyntheticEvent } from 'react-native/Libraries/Types/CoreEventTypes';

import { useBannerAwareSafeAreaInsets, useScrollDivider } from '@suite-native/atoms';
import { ScrollViewContext } from '@suite-native/scrollview';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { useDynamicHeader } from './DynamicHeader/DynamicScreenHeaderContext';

type ScreenContentProps = {
    children: ReactNode;
    isScrollable: boolean;
    hasHeader: boolean;
    scrollIndicatorTopInset?: number;
    // Space above the content, which is part of the scrollable area and offsets a refresh control.
    contentInsetTop?: number;
    scrollIndicatorBottomInset: number;
    focusedInputBottomOffset?: number;
    isDynamicHeader?: boolean;
    refreshControl?: ScrollViewProps['refreshControl'];
};

const screenContentWrapperStyle = prepareNativeStyle(() => ({ flexGrow: 1 }));

export const ScreenContentWrapper = ({
    children,
    isScrollable,
    hasHeader,
    scrollIndicatorTopInset = 0,
    contentInsetTop = 0,
    scrollIndicatorBottomInset,
    focusedInputBottomOffset,
    refreshControl,
    isDynamicHeader = false,
}: ScreenContentProps) => {
    const scrollViewRef = useRef<KeyboardAwareScrollViewRef | null>(null);
    const { applyStyle } = useNativeStyles();
    const { left, right } = useBannerAwareSafeAreaInsets();

    const { scrollDivider, handleScroll } = useScrollDivider({ left, right });
    const { handleDynamicHeaderScroll } = useDynamicHeader();

    const wasContentInsetTopApplied = useRef(false);

    // The inset is measured after the first render. Scroll the content from under the inset once,
    // since the scroll offset does not follow an inset that is added later.
    useEffect(() => {
        if (contentInsetTop <= 0 || wasContentInsetTopApplied.current) return;

        wasContentInsetTopApplied.current = true;
        scrollViewRef.current?.scrollTo({ y: -contentInsetTop, animated: false });
    }, [contentInsetTop]);

    const scrollHandler = (() => {
        if (hasHeader && isDynamicHeader) {
            return (event: NativeSyntheticEvent<NativeScrollEvent>) => {
                handleDynamicHeaderScroll(event);
                handleScroll(event);
            };
        }
        if (hasHeader) {
            return handleScroll;
        }

        return undefined;
    })();

    return isScrollable ? (
        <>
            {scrollDivider}
            <KeyboardAwareScrollView
                ref={scrollViewRef}
                bottomOffset={focusedInputBottomOffset}
                refreshControl={refreshControl}
                keyboardShouldPersistTaps="handled"
                contentInsetAdjustmentBehavior="never"
                contentInset={contentInsetTop > 0 ? { top: contentInsetTop } : undefined}
                automaticallyAdjustsScrollIndicatorInsets={false}
                scrollIndicatorInsets={{
                    top: scrollIndicatorTopInset,
                    left,
                    right,
                    bottom: scrollIndicatorBottomInset,
                }}
                contentContainerStyle={applyStyle(screenContentWrapperStyle)}
                onScroll={scrollHandler}
                testID="@screen/mainScrollView"
            >
                <ScrollViewContext.Provider value={scrollViewRef}>
                    {children}
                </ScrollViewContext.Provider>
            </KeyboardAwareScrollView>
        </>
    ) : (
        <>{children}</>
    );
};
