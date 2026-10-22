import { StyleSheet, View } from 'react-native';

import { type ScreenPerformanceRootProps } from './types';
import { useScreenPerformance } from './useScreenPerformance';

const styles = StyleSheet.create({
    root: { flex: 1 },
});

// The pan handlers only observe the first touch, they never claim the responder, so wrapping a
// screen in this view does not change how it handles gestures.
export const ScreenPerformanceRoot = ({
    screen,
    isReady,
    children,
}: ScreenPerformanceRootProps) => {
    const { panHandlers } = useScreenPerformance({ screen, isReady });

    return (
        <View style={styles.root} {...panHandlers}>
            {children}
        </View>
    );
};
