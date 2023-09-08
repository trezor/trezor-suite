import { useRef, useEffect, useContext } from 'react';
import { View, StyleSheet } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { ScreenshotContext } from './ScreenshotProvider';

export const ScreenshotCapturer = ({ children }: { children: React.ReactNode }) => {
    const navigation = useNavigation();
    const screenshotViewRef = useRef<View | null>(null);

    const { takeScreenshot } = useContext(ScreenshotContext);

    // Take screenshot on every navigation state change so it can be used for biometrics and other overlays later.
    useEffect(() => {
        const removeStateSubscription = navigation.addListener('state', () => {
            takeScreenshot(screenshotViewRef);
        });

        return removeStateSubscription;
    }, [navigation, takeScreenshot]);

    return (
        <View style={StyleSheet.absoluteFillObject} ref={screenshotViewRef}>
            {children}
        </View>
    );
};
