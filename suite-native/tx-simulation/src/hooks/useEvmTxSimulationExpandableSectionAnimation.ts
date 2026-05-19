import { useEffect } from 'react';
import { type LayoutChangeEvent } from 'react-native';
import { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const EXPAND_ANIMATION_DURATION = 200;

const expandAnimationConfig = {
    duration: EXPAND_ANIMATION_DURATION,
    easing: Easing.inOut(Easing.cubic),
};

export const useEvmTxSimulationExpandableSectionAnimation = ({
    isExpanded,
}: {
    isExpanded: boolean;
}) => {
    const measuredHeight = useSharedValue(0);
    const animatedHeight = useSharedValue(0);
    const animatedOpacity = useSharedValue(isExpanded ? 1 : 0);
    const isCaretExpanded = useSharedValue(isExpanded);
    const animatedContentStyle = useAnimatedStyle(() => ({
        height: animatedHeight.value,
        opacity: animatedOpacity.value,
        overflow: 'hidden',
    }));
    const animatedCaretStyle = useAnimatedStyle(() => ({
        transform: [
            {
                rotate: withTiming(`${isCaretExpanded.value ? -180 : 0}deg`, {
                    duration: EXPAND_ANIMATION_DURATION,
                }),
            },
        ],
    }));

    useEffect(() => {
        animatedHeight.set(
            withTiming(isExpanded ? measuredHeight.get() : 0, expandAnimationConfig),
        );
        animatedOpacity.set(withTiming(isExpanded ? 1 : 0, expandAnimationConfig));
        isCaretExpanded.set(isExpanded);
    }, [animatedHeight, animatedOpacity, isCaretExpanded, isExpanded, measuredHeight]);

    const handleContentLayout = (event: LayoutChangeEvent) => {
        const nextHeight = event.nativeEvent.layout.height;

        if (nextHeight === measuredHeight.get()) {
            return;
        }

        measuredHeight.set(nextHeight);

        if (isExpanded) {
            animatedHeight.set(withTiming(nextHeight, expandAnimationConfig));
        }
    };

    return {
        animatedCaretStyle,
        animatedContentStyle,
        handleContentLayout,
    };
};
