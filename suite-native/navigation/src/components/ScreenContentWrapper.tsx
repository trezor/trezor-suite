import React, { ReactNode, useRef } from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { ScrollView, ScrollViewProps } from 'react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { useScrollDivider } from '../useScrollDivider';
import { ScrollViewContext } from './ScrollViewContext';

type ScreenContentProps = {
    children: ReactNode;
    isScrollable: boolean;
    hasScreenHeader: boolean;
    extraKeyboardAvoidingViewHeight: number;
    refreshControl?: ScrollViewProps['refreshControl'];
    keyboardDismissMode?: ScrollViewProps['keyboardDismissMode'];
};

const screenContentWrapperStyle = prepareNativeStyle(() => ({ flexGrow: 1 }));

export const ScreenContentWrapper = ({
    children,
    isScrollable,
    hasScreenHeader,
    extraKeyboardAvoidingViewHeight,
    refreshControl,
    keyboardDismissMode,
}: ScreenContentProps) => {
    const scrollViewRef = useRef<ScrollView | null>(null);
    const { applyStyle } = useNativeStyles();

    const { scrollDivider, handleScroll } = useScrollDivider();

    return isScrollable ? (
        <>
            {scrollDivider}
            <KeyboardAwareScrollView
                innerRef={ref => {
                    // Assign the ref of inner ScrollView.
                    scrollViewRef.current = ref as unknown as ScrollView;
                }}
                keyboardDismissMode={keyboardDismissMode}
                keyboardShouldPersistTaps="handled"
                contentInsetAdjustmentBehavior="automatic"
                extraHeight={extraKeyboardAvoidingViewHeight}
                contentContainerStyle={applyStyle(screenContentWrapperStyle)}
                refreshControl={refreshControl}
                testID="@screen/mainScrollView"
                onScroll={hasScreenHeader ? handleScroll : undefined}
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
