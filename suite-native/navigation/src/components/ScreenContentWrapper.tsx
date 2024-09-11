import React, { ReactNode, useRef } from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { ScrollView, ScrollViewProps } from 'react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { ScrollViewContext } from './ScrollViewContext';

type ScreenContentProps = {
    children: ReactNode;
    isScrollable: boolean;
    extraKeyboardAvoidingViewHeight: number;
    refreshControl?: ScrollViewProps['refreshControl'];
    keyboardDismissMode?: ScrollViewProps['keyboardDismissMode'];
    keyboardShouldPersistTaps?: ScrollViewProps['keyboardShouldPersistTaps'];
};

const screenContentWrapperStyle = prepareNativeStyle(() => ({ flexGrow: 1 }));

export const ScreenContentWrapper = ({
    children,
    isScrollable,
    extraKeyboardAvoidingViewHeight,
    refreshControl,
    keyboardDismissMode,
    keyboardShouldPersistTaps = 'always',
}: ScreenContentProps) => {
    const scrollViewRef = useRef<ScrollView | null>(null);
    const { applyStyle } = useNativeStyles();

    return isScrollable ? (
        <KeyboardAwareScrollView
            innerRef={ref => {
                // Assign the ref of inner ScrollView.
                scrollViewRef.current = ref as unknown as ScrollView;
            }}
            keyboardShouldPersistTaps={keyboardShouldPersistTaps}
            keyboardDismissMode={keyboardDismissMode}
            contentInsetAdjustmentBehavior="automatic"
            extraHeight={extraKeyboardAvoidingViewHeight}
            contentContainerStyle={applyStyle(screenContentWrapperStyle)}
            refreshControl={refreshControl}
            testID="@screen/mainScrollView"
        >
            <ScrollViewContext.Provider value={scrollViewRef}>
                {children}
            </ScrollViewContext.Provider>
        </KeyboardAwareScrollView>
    ) : (
        <>{children}</>
    );
};
