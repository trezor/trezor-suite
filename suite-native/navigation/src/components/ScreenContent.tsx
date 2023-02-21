import React, { ReactNode } from 'react';
import { EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box } from '@suite-native/atoms';

type ScreenContentProps = {
    children: ReactNode;
    footer: ReactNode;
    isScrollable: boolean;
    customVerticalPadding: number;
    customHorizontalPadding: number;
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
    footer,
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

    return (
        <>
            {isScrollable ? (
                <KeyboardAwareScrollView
                    keyboardShouldPersistTaps="always"
                    contentInsetAdjustmentBehavior="automatic"
                    contentContainerStyle={screenStyle}
                    viewIsInsideTabBar
                >
                    {children}
                </KeyboardAwareScrollView>
            ) : (
                <Box style={screenStyle}>{children}</Box>
            )}
            {footer}
        </>
    );
};
