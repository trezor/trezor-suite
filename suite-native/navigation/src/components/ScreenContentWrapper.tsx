import React, { ReactNode, useRef } from 'react';
import { ScrollViewProps } from 'react-native';
import {
    KeyboardAwareScrollView,
    KeyboardAwareScrollViewRef,
} from 'react-native-keyboard-controller';

import { NativeScrollEvent } from 'react-native/Libraries/Components/ScrollView/ScrollView';
import { NativeSyntheticEvent } from 'react-native/Libraries/Types/CoreEventTypes';

import { ScrollViewContext, useScrollDivider } from '@suite-native/scrollview';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { useDynamicHeader } from './DynamicHeader/DynamicScreenHeaderContext';

type ScreenContentProps = {
    children: ReactNode;
    isScrollable: boolean;
    hasHeader: boolean;
    focusedInputBottomOffset?: number;
    isDynamicHeader?: boolean;
    refreshControl?: ScrollViewProps['refreshControl'];
};

const screenContentWrapperStyle = prepareNativeStyle(() => ({ flexGrow: 1 }));

export const ScreenContentWrapper = ({
    children,
    isScrollable,
    hasHeader,
    focusedInputBottomOffset,
    refreshControl,
    isDynamicHeader = false,
}: ScreenContentProps) => {
    const scrollViewRef = useRef<KeyboardAwareScrollViewRef | null>(null);
    const { applyStyle } = useNativeStyles();

    const { scrollDivider, handleScroll } = useScrollDivider();
    const { handleDynamicHeaderScroll } = useDynamicHeader();

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
