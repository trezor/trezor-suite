import React from 'react';
import { StyleSheet, View } from 'react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const storyContainerStyle = prepareNativeStyle(utils => ({
    flex: 1,
    paddingTop: utils.spacings.sp32,
    paddingHorizontal: utils.spacings.sp16,
    backgroundColor: utils.colors.backgroundSurfaceElevation0,
    ...StyleSheet.absoluteFillObject,
}));

const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
    const { applyStyle } = useNativeStyles();

    return <View style={applyStyle(storyContainerStyle)}>{children}</View>;
};

export const layoutDecorator = (Story: React.FC) => (
    <LayoutWrapper>
        <Story />
    </LayoutWrapper>
);
