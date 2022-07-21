import React, { ReactNode } from 'react';
import { SafeAreaView, ScrollView, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box } from '@suite-native/atoms';

type ScreenProps = {
    children: ReactNode;
    header?: ReactNode;
};

const screenStyle = prepareNativeStyle<{ insetTop: number }>((utils, { insetTop }) => ({
    flex: 1,
    backgroundColor: '#E5E5E5',
    paddingTop: Math.max(insetTop, utils.spacings.medium),
}));

export const Screen = ({ children, header }: ScreenProps) => {
    const { applyStyle } = useNativeStyles();
    const insets = useSafeAreaInsets();

    return (
        <SafeAreaView style={applyStyle(screenStyle, { insetTop: insets.top })}>
            <StatusBar barStyle="dark-content" />
            {header && header}
            <ScrollView contentInsetAdjustmentBehavior="automatic">
                <Box>{children}</Box>
            </ScrollView>
        </SafeAreaView>
    );
};
