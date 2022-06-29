import React, { ReactNode } from 'react';
import { View } from 'react-native';
import { gestureHandlerRootHOC } from 'react-native-gesture-handler';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const modalWithOverlayStyle = prepareNativeStyle(utils => ({
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: utils.transparentize(0.3, utils.colors.black),
}));

/**
 * On Android RNGH does not work by default because modals are not located under React Native Root view in native hierarchy.
 * To fix that, components need to be wrapped with gestureHandlerRootHOC (it's no-op on iOS and web).
 * See more details: https://docs.swmansion.com/react-native-gesture-handler/docs/installation/#usage-with-modals-on-android
 */
export const BottomModalGestureHandler = gestureHandlerRootHOC(
    ({ children }: { children: ReactNode }) => {
        const { applyStyle } = useNativeStyles();

        return <View style={applyStyle(modalWithOverlayStyle)}>{children}</View>;
    },
);
