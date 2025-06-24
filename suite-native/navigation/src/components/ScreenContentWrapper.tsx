import React, { ReactElement, ReactNode, isValidElement, useRef } from 'react';
import { ScrollView, ScrollViewProps } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { useScrollDivider } from '../useScrollDivider';
import { ScreenSubHeaderProps } from './ScreenHeader';
import { ScrollViewContext } from './ScrollViewContext';

type ScreenContentProps = {
    children: ReactNode;
    isScrollable: boolean;
    header: ReactNode;
    focusedInputBottomOffset?: number;
    shouldShowScrollDivider?: boolean;
    refreshControl?: ScrollViewProps['refreshControl'];
};

const screenContentWrapperStyle = prepareNativeStyle(() => ({ flexGrow: 1 }));

// Helper function to check if a React element is a ScreenHeader
const isValidScreenHeaderElement = (
    element: ReactNode,
): element is ReactElement<ScreenSubHeaderProps> =>
    isValidElement(element) &&
    typeof element.type === 'function' &&
    element.type.name === 'ScreenHeader';

// Helper function to extract content from ScreenHeader
export const extractScreenHeaderProps = (header: ReactNode): ScreenSubHeaderProps | null => {
    if (isValidScreenHeaderElement(header)) {
        return header.props;
    }

    return null;
};

export const ScreenContentWrapper = ({
    children,
    isScrollable,
    header,
    focusedInputBottomOffset,
    refreshControl,
    shouldShowScrollDivider = true,
}: ScreenContentProps) => {
    const scrollViewRef = useRef<ScrollView | null>(null);
    const { applyStyle } = useNativeStyles();

    const { scrollDivider, handleScroll } = useScrollDivider();

    return isScrollable ? (
        <>
            {shouldShowScrollDivider && scrollDivider}
            <KeyboardAwareScrollView
                ref={scrollViewRef}
                bottomOffset={focusedInputBottomOffset}
                refreshControl={refreshControl}
                keyboardShouldPersistTaps="handled"
                contentInsetAdjustmentBehavior="never"
                contentContainerStyle={applyStyle(screenContentWrapperStyle)}
                onScroll={header ? handleScroll : undefined}
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
