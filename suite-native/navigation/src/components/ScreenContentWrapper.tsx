import React, { ReactNode, useRef } from 'react';
import { ScrollView, ScrollViewProps } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { NativeScrollEvent } from 'react-native/Libraries/Components/ScrollView/ScrollView';
import { NativeSyntheticEvent } from 'react-native/Libraries/Types/CoreEventTypes';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { useScrollDivider } from '../useScrollDivider';
import { useDynamicHeader } from './DynamicHeader/DynamicScreenHeaderContext';
import { ScrollViewContext } from './ScrollViewContext';

type ScreenContentProps = {
    children: ReactNode;
    isScrollable: boolean;
    hasHeader: boolean;
    focusedInputBottomOffset?: number;
    isDynamicHeader?: boolean;
    refreshControl?: ScrollViewProps['refreshControl'];
};

const screenContentWrapperStyle = prepareNativeStyle(utils => ({
    flexGrow: 1,

    backgroundColor: utils.colors.backgroundSurfaceElevation0,
    borderRadius: utils.borders.radii.r16,
}));

export const ScreenContentWrapper = ({
    children,
    isScrollable,
    hasHeader,
    focusedInputBottomOffset,
    refreshControl,
    isDynamicHeader = false,
}: ScreenContentProps) => {
    const scrollViewRef = useRef<ScrollView | null>(null);
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
