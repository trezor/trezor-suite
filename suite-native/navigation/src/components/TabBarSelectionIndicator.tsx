import { useAnimatedStyle, withSpring } from 'react-native-reanimated';

import { AnimatedView } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const INDICATOR_SPRING = { damping: 20, stiffness: 200, mass: 0.6 };

const indicatorStyle = prepareNativeStyle<{ width: number }>((utils, { width }) => ({
    position: 'absolute',
    top: utils.spacings.sp4,
    bottom: utils.spacings.sp4,
    left: utils.spacings.sp4,
    width,
    borderRadius: utils.borders.radii.round,
    backgroundColor: utils.colors.elementFillNeutralSoft,
}));

type TabBarSelectionIndicatorProps = {
    itemWidth: number;
    selectedIndex: number;
};

export const TabBarSelectionIndicator = ({
    itemWidth,
    selectedIndex,
}: TabBarSelectionIndicatorProps) => {
    const { applyStyle } = useNativeStyles();

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: withSpring(selectedIndex * itemWidth, INDICATOR_SPRING) }],
    }));

    return (
        <AnimatedView
            pointerEvents="none"
            style={[applyStyle(indicatorStyle, { width: itemWidth }), animatedStyle]}
        />
    );
};
