import React from 'react';
import { View } from 'react-native';

import { useNativeStyles } from '@trezor/styles-native';

import { animationStyle } from './BluetoothPairingAnimation.styles';

// Looping H.264 playback is decoded by the Android emulator host process, which
// destabilizes it on CI runners, so E2E builds only reserve the layout space.
export const BluetoothPairingAnimation = () => {
    const { applyStyle } = useNativeStyles();

    return <View style={applyStyle(animationStyle)} />;
};
