import { StyleSheet, View } from 'react-native';

import { type ScreenPerformanceRootProps } from './types';

const styles = StyleSheet.create({
    root: { flex: 1 },
});

// The pan handlers only observe the first touch, they never claim the responder, so wrapping a
// screen in this view does not change how it handles gestures.
export const ScreenPerformanceRoot = ({ panHandlers, children }: ScreenPerformanceRootProps) => (
    <View style={styles.root} {...panHandlers}>
        {children}
    </View>
);
