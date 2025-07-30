import { useCallback, useImperativeHandle, useMemo, useState } from 'react';
import { LayoutChangeEvent } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import { clamp, useSharedValue, withSpring } from 'react-native-reanimated';

import * as Haptics from 'expo-haptics';

import { useBannerAwareSafeAreaInsets } from '@suite-native/atoms';
import { getScreenHeight } from '@trezor/env-utils';

const SCREEN_HEIGHT = getScreenHeight();

export type BottomSheetControlProps = {
    triggerTransition: (onAnimationStart?: () => void) => void;
    closeSheet: () => void;
};

type Props = {
    controlRef?: React.Ref<BottomSheetControlProps>;
};

export const useConfirmOnTrezorSheet = ({ controlRef }: Props) => {
    const currentIndex = useSharedValue(2);

    const [containerHeight, setContainerHeight] = useState(SCREEN_HEIGHT);
    const [headerHeight, setHeaderHeight] = useState(0);
    const translateY = useSharedValue(0);
    const prevTranslationY = useSharedValue(0);

    const [isFullscreen, setIsFullscreen] = useState(true);

    const inset = useBannerAwareSafeAreaInsets();

    const animatedOffset = useSharedValue(inset.top);

    const snapPoints = useMemo(() => {
        const totalHeaderHeight = headerHeight + inset.top;

        return [containerHeight * 0.8, totalHeaderHeight, 0];
    }, [containerHeight, headerHeight, inset.top]);

    const snapToIndex = useCallback(
        (index: number) => {
            'worklet';
            const targetY = snapPoints[index];
            translateY.value = withSpring(targetY, {
                damping: 20,
                stiffness: 150,
            });
            currentIndex.value = index;
        },
        [snapPoints, translateY, currentIndex],
    );

    const triggerTransition = useCallback(
        (onAnimationStart?: () => void) => {
            onAnimationStart?.();

            snapToIndex(1);
            setIsFullscreen(false);
        },
        [snapToIndex],
    );

    const closeSheet = useCallback(() => {
        snapToIndex(2);
        setIsFullscreen(true);
    }, [snapToIndex]);

    useImperativeHandle(
        controlRef,
        () => ({
            closeSheet,
            triggerTransition,
        }),
        [closeSheet, triggerTransition],
    );

    const toggleSheet = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const nextIndex = currentIndex.value === 0 ? 1 : 0;
        snapToIndex(nextIndex);
    };

    const handleHeaderLayout = useCallback((event: LayoutChangeEvent) => {
        const { height } = event.nativeEvent.layout;
        setHeaderHeight(height);
    }, []);

    const handleContainerLayout = useCallback((event: LayoutChangeEvent) => {
        const { height } = event.nativeEvent.layout;
        setContainerHeight(height);
    }, []);

    const panGesture = Gesture.Pan()
        .enabled(!isFullscreen)
        .onStart(() => {
            prevTranslationY.value = translateY.value;
        })
        .onUpdate(e => {
            translateY.value = clamp(
                prevTranslationY.value + e.translationY,
                snapPoints[1],
                snapPoints[0],
            );
        })
        .onEnd(e => {
            const maxVelocity = 30;
            if (Math.abs(e.velocityY) < maxVelocity) {
                snapToIndex(currentIndex.value);
            } else {
                const newIndex = e.velocityY < 0 ? 1 : 0;
                snapToIndex(newIndex);
            }
        });

    return {
        handleHeaderLayout,
        handleContainerLayout,
        triggerTransition,
        toggleSheet,
        isFullscreen,
        snapPoints,
        translateY,
        currentIndex,
        animatedOffset,
        panGesture,
        containerHeight,
        headerHeight,
    };
};
