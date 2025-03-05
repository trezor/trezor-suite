import React, { ReactNode, useRef } from 'react';
import { ScrollView, ScrollViewProps } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { useScrollDivider } from '../useScrollDivider';
import { ScrollViewContext } from './ScrollViewContext';

type ScreenContentProps = {
    children: ReactNode;
    isScrollable: boolean;
    hasHeader: boolean;
    focusedInputBottomOffset?: number;
    refreshControl?: ScrollViewProps['refreshControl'];
};

const screenContentWrapperStyle = prepareNativeStyle(() => ({ flexGrow: 1 }));

export const ScreenContentWrapper = ({
    children,
    isScrollable,
    hasHeader,
    focusedInputBottomOffset,
    refreshControl,
}: ScreenContentProps) => {
    const scrollViewRef = useRef<ScrollView | null>(null);
    const { applyStyle } = useNativeStyles();

    const { scrollDivider, handleScroll } = useScrollDivider();

    return isScrollable ? (
        <>
            {scrollDivider}
            <KeyboardAwareScrollView
                ref={scrollViewRef}
                bottomOffset={focusedInputBottomOffset}
                refreshControl={refreshControl}
                keyboardShouldPersistTaps="handled"
                contentInsetAdjustmentBehavior="never"
                contentContainerStyle={applyStyle(screenContentWrapperStyle)}
                onScroll={hasHeader ? handleScroll : undefined}
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
