import React, { ReactNode } from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { ScrollViewProps } from 'react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type ScreenContentProps = {
    children: ReactNode;
    isScrollable: boolean;
    extraKeyboardAvoidingViewHeight: number;
    refreshControl?: ScrollViewProps['refreshControl'];
};

const screenContentWrapperStyle = prepareNativeStyle(() => ({ flexGrow: 1 }));

export const ScreenContentWrapper = ({
    children,
    isScrollable,
    extraKeyboardAvoidingViewHeight,
    refreshControl,
}: ScreenContentProps) => {
    const { applyStyle } = useNativeStyles();

    return isScrollable ? (
        <KeyboardAwareScrollView
            keyboardShouldPersistTaps="always"
            contentInsetAdjustmentBehavior="automatic"
            extraHeight={extraKeyboardAvoidingViewHeight}
            contentContainerStyle={applyStyle(screenContentWrapperStyle)}
            refreshControl={refreshControl}
        >
            {children}
        </KeyboardAwareScrollView>
    ) : (
        <>{children}</>
    );
};
