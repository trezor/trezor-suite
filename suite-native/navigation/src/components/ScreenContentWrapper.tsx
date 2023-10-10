import React, { ReactNode } from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

type ScreenContentProps = {
    children: ReactNode;
    isScrollable: boolean;
    extraKeyboardAvoidingViewHeight: number;
};

export const ScreenContentWrapper = ({
    children,
    isScrollable,
    extraKeyboardAvoidingViewHeight,
}: ScreenContentProps) =>
    isScrollable ? (
        <KeyboardAwareScrollView
            keyboardShouldPersistTaps="always"
            contentInsetAdjustmentBehavior="automatic"
            extraHeight={extraKeyboardAvoidingViewHeight}
        >
            {children}
        </KeyboardAwareScrollView>
    ) : (
        <>{children}</>
    );
