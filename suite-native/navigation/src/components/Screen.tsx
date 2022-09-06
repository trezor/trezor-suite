import React, { ReactNode } from 'react';
import { SafeAreaView, ScrollView, StatusBar } from 'react-native';
import { useSafeAreaInsets, EdgeInsets } from 'react-native-safe-area-context';

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
    backgroundColor: Color;
}>((utils, { backgroundColor }) => ({
    flex: 1,
    backgroundColor: utils.colors[backgroundColor],
}));

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
                    backgroundColor,
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
                contentContainerStyle={applyStyle(screenContentStyle, {
                    insets,
                    customHorizontalPadding,
                    customVerticalPadding,
                })}
            >
                {children}
            </ScrollView>
        </SafeAreaView>
    );
};
