import React, { ReactNode } from 'react';
import { SafeAreaView, StatusBar, View } from 'react-native';
import { useSafeAreaInsets, EdgeInsets } from 'react-native-safe-area-context';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Color, nativeSpacings } from '@trezor/theme';

import { ScreenContent } from './ScreenContent';

type ScreenProps = {
    children: ReactNode;
    header?: ReactNode;
    hasStatusBar?: boolean;
    isScrollable?: boolean;
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

const screenHeaderStyle = prepareNativeStyle<{
    insets: EdgeInsets;
    customHorizontalPadding: number;
    customVerticalPadding: number;
}>((_, { insets, customHorizontalPadding, customVerticalPadding }) => {
    const { top, right, left } = insets;
    return {
        paddingTop: Math.max(top, customVerticalPadding),
        paddingLeft: Math.max(left, customHorizontalPadding),
        paddingRight: Math.max(right, customHorizontalPadding),
    };
});

export const Screen = ({
    children,
    header,
    isScrollable = true,
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
            {header && (
                <View
                    style={[
                        applyStyle(screenHeaderStyle, {
                            insets,
                            customHorizontalPadding,
                            customVerticalPadding,
                        }),
                    ]}
                >
                    {header}
                </View>
            )}
            <ScreenContent
                isScrollable={isScrollable}
                customVerticalPadding={customVerticalPadding}
                customHorizontalPadding={customHorizontalPadding}
            >
                {children}
            </ScreenContent>
        </SafeAreaView>
    );
};
