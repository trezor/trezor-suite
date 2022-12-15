import React, { ReactNode } from 'react';
import { EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { nativeSpacings } from '@trezor/theme';

type ScreenContentProps = {
    children: ReactNode;
    customVerticalPadding?: number;
    customHorizontalPadding?: number;
};

const screenContentStyle = prepareNativeStyle<{
    insets: EdgeInsets;
    customHorizontalPadding: number;
    customVerticalPadding: number;
}>((_, { customHorizontalPadding, customVerticalPadding, insets }) => {
    const { bottom, left, right } = insets;
    return {
        flexGrow: 1,
        paddingTop: customVerticalPadding,
        paddingBottom: Math.max(bottom, customVerticalPadding),
        paddingLeft: Math.max(left, customHorizontalPadding),
        paddingRight: Math.max(right, customHorizontalPadding),
    };
});

export const ScreenContent = ({
    children,
    customHorizontalPadding = nativeSpacings.medium,
    customVerticalPadding = nativeSpacings.medium,
}: ScreenContentProps) => {
    const { applyStyle } = useNativeStyles();
    const insets = useSafeAreaInsets();

    return (
        <KeyboardAwareScrollView
            keyboardShouldPersistTaps="always"
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={applyStyle(screenContentStyle, {
                insets,
                customHorizontalPadding,
                customVerticalPadding,
            })}
        >
            {children}
        </KeyboardAwareScrollView>
    );
};
