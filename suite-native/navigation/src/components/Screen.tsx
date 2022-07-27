import React, { ReactNode } from 'react';
import { SafeAreaView, ScrollView, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Color } from '@trezor/theme';

type ScreenProps = {
    children: ReactNode;
    header?: ReactNode;
    hasStatusBar?: boolean;
    backgroundColor?: Color;
};

const screenContainerStyle = prepareNativeStyle<{ insetTop: number; backgroundColor: Color }>(
    (utils, { insetTop, backgroundColor }) => ({
        flex: 1,
        backgroundColor,
        paddingTop: Math.max(insetTop, utils.spacings.medium),
    }),
);

const screenContentStyle = prepareNativeStyle(_ => ({
    flexGrow: 1,
}));

export const Screen = ({
    children,
    header,
    hasStatusBar = true,
    backgroundColor = 'gray100',
}: ScreenProps) => {
    const { applyStyle } = useNativeStyles();
    const insets = useSafeAreaInsets();

    return (
        <SafeAreaView
            style={[applyStyle(screenContainerStyle, { insetTop: insets.top, backgroundColor })]}
        >
            <StatusBar barStyle="dark-content" hidden={!hasStatusBar} />
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
