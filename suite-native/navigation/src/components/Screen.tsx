import React, { ReactNode } from 'react';
import { SafeAreaView, ScrollView, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Color, nativeSpacings } from '@trezor/theme';

type ScreenProps = {
    children: ReactNode;
    header?: ReactNode;
    hasStatusBar?: boolean;
    backgroundColor?: Color;
    customVerticalPadding?: number;
    customHorizontalPadding?: number;
};

const screenContainerStyle = prepareNativeStyle<{
    insetTop: number;
    backgroundColor: Color;
    customHorizontalPadding: number;
    customVerticalPadding: number;
}>((_, { insetTop, backgroundColor, customHorizontalPadding, customVerticalPadding }) => ({
    flex: 1,
    backgroundColor,
    paddingVertical: Math.max(insetTop, customVerticalPadding),
    paddingHorizontal: Math.max(insetTop, customHorizontalPadding),
}));

const screenContentStyle = prepareNativeStyle(_ => ({
    flexGrow: 1,
}));

export const Screen = ({
    children,
    header,
    hasStatusBar = true,
    backgroundColor = 'gray100',
    customVerticalPadding = nativeSpacings.medium,
    customHorizontalPadding = nativeSpacings.medium,
}: ScreenProps) => {
    const { applyStyle } = useNativeStyles();
    const insets = useSafeAreaInsets();

    return (
        <SafeAreaView
            style={[
                applyStyle(screenContainerStyle, {
                    insetTop: insets.top,
                    backgroundColor,
                    customHorizontalPadding,
                    customVerticalPadding,
                }),
            ]}
        >
            <StatusBar
                barStyle="dark-content"
                hidden={!hasStatusBar}
                translucent={!hasStatusBar}
                backgroundColor="transparent"
            />
            {header && header}
            <ScrollView
                contentInsetAdjustmentBehavior="automatic"
                contentContainerStyle={applyStyle(screenContentStyle)}
            >
                {children}
            </ScrollView>
        </SafeAreaView>
    );
};
