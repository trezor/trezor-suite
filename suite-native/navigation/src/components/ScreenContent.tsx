import React, { ReactNode } from 'react';
import { EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box } from '@suite-native/atoms';

type ScreenContentProps = {
    children: ReactNode;
    isScrollable: boolean;
    customVerticalPadding: number;
    customHorizontalPadding: number;
};

const screenContentStyle = prepareNativeStyle<{
    insets: EdgeInsets;
    customHorizontalPadding: number;
    customVerticalPadding: number;
}>((_, { insets, customHorizontalPadding, customVerticalPadding }) => {
    const { top, right, bottom, left } = insets;
    return {
        flexGrow: 1,
        paddingTop: Math.max(top, customVerticalPadding),
        paddingBottom: Math.max(bottom, customVerticalPadding),
        paddingLeft: Math.max(left, customHorizontalPadding),
        paddingRight: Math.max(right, customHorizontalPadding),
    };
});

export const ScreenContent = ({
    children,
    isScrollable,
    customHorizontalPadding,
    customVerticalPadding,
}: ScreenContentProps) => {
    const { applyStyle } = useNativeStyles();
    const insets = useSafeAreaInsets();

    const screenStyle = applyStyle(screenContentStyle, {
        insets,
        customHorizontalPadding,
        customVerticalPadding,
    });

    if (!isScrollable) return <Box style={screenStyle}>{children}</Box>;

    return (
        <KeyboardAwareScrollView
            keyboardShouldPersistTaps="always"
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={screenStyle}
        >
            {children}
        </KeyboardAwareScrollView>
    );
};
