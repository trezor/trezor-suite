import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useAnimatedReaction,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { AnimatedVStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const SNAP_SPRING = { damping: 20, stiffness: 200, mass: 0.5 };

const DOT_ACTIVE_WIDTH = 16;
const DOT_INACTIVE_WIDTH = 4;
const DOT_HEIGHT = 4;

const dotsRowStyle = prepareNativeStyle(utils => ({
    height: DOT_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: utils.spacings.sp4,
}));

const dotBaseStyle = prepareNativeStyle(() => ({
    height: DOT_HEIGHT,
    borderRadius: 100,
}));

const slideRowStyle = prepareNativeStyle(() => ({
    flexDirection: 'row',
}));

type DotProps = {
    isActive: boolean;
};

const Dot = ({ isActive }: DotProps) => {
    const { applyStyle, utils } = useNativeStyles();

    const dotAnimatedStyle = useAnimatedStyle(() => ({
        width: withSpring(isActive ? DOT_ACTIVE_WIDTH : DOT_INACTIVE_WIDTH, SNAP_SPRING),
        backgroundColor: isActive ? utils.colors.contentNeutral : utils.colors.borderNeutral,
    }));

    return <Animated.View style={[applyStyle(dotBaseStyle), dotAnimatedStyle]} />;
};

type CarouselDotsProps = {
    count: number;
    activeIndex: number;
};

const CarouselDots = ({ count, activeIndex }: CarouselDotsProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <View style={applyStyle(dotsRowStyle)}>
            {Array.from({ length: count }).map((_, index) => (
                <Dot key={index} isActive={index === activeIndex} />
            ))}
        </View>
    );
};

type PromoBannerCarouselProps = {
    items: ReactNode[];
};

export const PromoBannerCarousel = ({ items }: PromoBannerCarouselProps) => {
    const { applyStyle, utils } = useNativeStyles();
    const { width: screenWidth } = useWindowDimensions();

    // Slot width = screenWidth - sp16: card sits at [sp16, screenWidth-sp16] at rest,
    // and the next card's left edge is exactly at the right screen edge.
    const slotWidth = screenWidth - utils.spacings.sp16;

    const [activeIndex, setActiveIndex] = useState(0);
    const translateX = useSharedValue(0);
    const dragStartX = useSharedValue(0);
    const targetTranslateX = useSharedValue<number | null>(null);

    const count = items.length;

    useEffect(() => {
        const maxIndex = count - 1;
        if (activeIndex > maxIndex) {
            const clamped = Math.max(0, maxIndex);
            setActiveIndex(clamped);
            targetTranslateX.value = -clamped * slotWidth;
        }
    }, [count, activeIndex, slotWidth, targetTranslateX]);

    useAnimatedReaction(
        () => targetTranslateX.value,
        target => {
            if (target !== null) {
                translateX.value = withSpring(target, SNAP_SPRING);
            }
        },
    );

    const handleSnapEnd = useCallback((index: number) => {
        setActiveIndex(index);
    }, []);

    const panGesture = Gesture.Pan()
        .activeOffsetX([-10, 10])
        .onBegin(() => {
            dragStartX.value = translateX.value;
        })
        .onUpdate(e => {
            const min = -(count - 1) * slotWidth;
            // eslint-disable-next-line react-hooks/immutability
            translateX.value = Math.max(min, Math.min(0, dragStartX.value + e.translationX));
        })
        .onEnd(e => {
            const current = Math.round(-translateX.value / slotWidth);
            let next = current;

            if (Math.abs(e.velocityX) > 300) {
                next = e.velocityX < 0 ? current + 1 : current - 1;
            }

            next = Math.max(0, Math.min(count - 1, next));
            // eslint-disable-next-line react-hooks/immutability
            translateX.value = withSpring(-next * slotWidth, SNAP_SPRING);
            scheduleOnRN(handleSnapEnd, next);
        });

    const slideRowAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    if (count === 0) return null;

    return (
        <AnimatedVStack spacing="sp12" alignItems="center">
            <GestureDetector gesture={panGesture}>
                <View style={{ width: screenWidth, overflow: 'hidden' }}>
                    <Animated.View style={[applyStyle(slideRowStyle), slideRowAnimatedStyle]}>
                        {items.map((item, index) => (
                            <View
                                key={index}
                                style={{ width: slotWidth, paddingLeft: utils.spacings.sp16 }}
                            >
                                {item}
                            </View>
                        ))}
                    </Animated.View>
                </View>
            </GestureDetector>
            {count > 1 && <CarouselDots count={count} activeIndex={activeIndex} />}
        </AnimatedVStack>
    );
};
