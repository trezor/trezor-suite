import React, { ReactNode } from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type ScreenContentProps = {
    children: ReactNode;
    isScrollable: boolean;
    extraKeyboardAvoidingViewHeight: number;
};

const screenContentWrapperStyle = prepareNativeStyle(() => ({ flexGrow: 1 }));

export const ScreenContentWrapper = ({
    children,
    isScrollable,
    extraKeyboardAvoidingViewHeight,
}: ScreenContentProps) => {
    const { applyStyle } = useNativeStyles();

    return isScrollable ? (
        <KeyboardAwareScrollView
            keyboardShouldPersistTaps="always"
            contentInsetAdjustmentBehavior="automatic"
            extraHeight={extraKeyboardAvoidingViewHeight}
            contentContainerStyle={applyStyle(screenContentWrapperStyle)}
        >
            {children}
        </KeyboardAwareScrollView>
    ) : (
        <>{children}</>
    );
};
